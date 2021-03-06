import * as R from 'ramda'
import pool from './config'
import { COMMANDS, SLASH_COMMANDS } from './constants'

const cleanAliases = aliases => {
  return R.pipe(
    R.map(alias => alias.trim().toLowerCase()),
    R.filter(alias => !!alias),
    R.uniq
  )(aliases.split(','))
}

const clearProjectAliases = async projectId => {
  try {
    await pool.query('DELETE FROM aliases WHERE projectId = $1', [projectId])
  } catch (err) {
    console.log('handle this error deleting aliases')
  }
}

const updateAliases = async (aliases, projectId, projectName) => {
  clearProjectAliases(projectId)
  const aliasList = cleanAliases(aliases)

  // Ensure the actual project name is in the alias list
  if (!aliasList.includes(projectName.toLowerCase())) {
    aliasList.push(projectName.toLowerCase())
  }
  R.forEach(async alias => {
    try {
      await pool.query(
        `INSERT INTO aliases (alias, projectid) VALUES ($1, $2)`,
        [alias, projectId]
      )
    } catch (err) {
      console.log('handle this error in inserting an alias')
    }
  })(aliasList)
}

export const getInvalidAliases = async (projectId, aliasString) => {
  const aliases = cleanAliases(aliasString)
  const invalidAliases = await pool.query(
    'SELECT alias FROM aliases WHERE projectId != $1',
    [projectId || -1]
  )
  const existingAliases = R.pluck('alias', invalidAliases.rows)
  const slashCommands = R.map(
    command => command.toLowerCase(),
    R.values(SLASH_COMMANDS)
  )
  return R.union(
    R.intersection(slashCommands, aliases),
    R.intersection(existingAliases, aliases)
  )
}

export const addItem = async (name, sectionId, url, description, type) => {
  const maxRankResults = await pool.query(
    'SELECT MAX(rank) FROM items WHERE sectionId = $1',
    [sectionId]
  )
  const maxRank = maxRankResults.rows[0].max
  const rank = maxRank === null ? 0 : maxRank + 1
  await pool.query(
    'INSERT INTO items (name, url, description, type, sectionId, rank) VALUES ($1, $2, $3, $4, $5, $6)',
    [name, url, description, type, sectionId, rank]
  )
}

export const addSection = async (name, projectId) => {
  const maxRankResults = await pool.query(
    'SELECT MAX(rank) FROM sections WHERE projectId = $1',
    [projectId]
  )
  const maxRank = maxRankResults.rows[0].max
  const rank = maxRank === null ? 0 : maxRank + 1
  await pool.query(
    'INSERT INTO sections (name, projectId, rank) VALUES ($1, $2, $3)',
    [name, projectId, rank]
  )
}

export const addProject = async (name, description, aliases) => {
  await pool.query('INSERT INTO projects (name, description) VALUES ($1, $2)', [
    name,
    description || '',
  ])
  const idResults = await pool.query(
    'SELECT ID from projects WHERE name = $1',
    [name]
  )
  const projectId = idResults.rows[0].id
  await addSection('Design', projectId)
  await addSection('Environments', projectId)
  await updateAliases(aliases, projectId, name)
}

export const updateItem = async (itemId, name, url, description, type) => {
  return pool.query(
    'UPDATE items set name = $1, url = $2, description = $3, type = $4 WHERE ID = $5',
    [name, url, description, type, itemId]
  )
}

export const updateSection = async (sectionId, name) => {
  return pool.query('UPDATE sections set name = $1 WHERE ID = $2', [
    name,
    sectionId,
  ])
}

export const updateProject = async (projectId, name, description, aliases) => {
  await pool.query(
    'UPDATE projects set name = $1, description = $2 WHERE ID = $3',
    [name, description, projectId]
  )
  return updateAliases(aliases, projectId, name)
}

const getById = async (table, id) => {
  const tableResult = await pool.query(`SELECT * FROM ${table} WHERE ID = $1`, [
    id,
  ])
  return tableResult.rows[0]
}

export const getItemById = async itemId => {
  return getById('items', itemId)
}

export const getSectionById = async sectionId => {
  return getById('sections', sectionId)
}

export const getProjectById = async projectId => {
  const project = await getById('projects', projectId)
  const aliasesResults = await pool.query(
    `SELECT alias FROM aliases WHERE projectid = $1`,
    [project.id]
  )
  project.aliases = R.pluck('alias', aliasesResults.rows).join(', ')
  return project
}

const projectRowReducer = (origProject, row) => {
  const project = { ...origProject }
  if (!project.id) {
    project.id = row.project_id
  }
  if (!project.name) {
    project.name = row.project_name
  }
  if (!project.description) {
    project.description = row.project_description
  }
  if (!project.sections[row.section_rank]) {
    project.sections[row.section_rank] = {
      id: row.section_id,
      name: row.section_name,
      rank: row.section_rank,
      items: [],
    }
  }
  if (row.item_id) {
    project.sections[row.section_rank].items.push({
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      url: row.item_url,
      rank: row.item_rank,
      type: row.item_type,
    })
  }
  return project
}

export const getFullProject = async projectName => {
  const projectResults = await pool.query(
    `
    SELECT
     projects.ID as project_id,
     projects.name as project_name,
     projects.description as project_description,
     sections.ID as section_id,
     sections.name as section_name,
     sections.rank as section_rank,
     items.ID as item_id,
     items.name as item_name,
     items.url as item_url,
     items.description as item_description,
     items.rank as item_rank,
     items.type as item_type
    FROM aliases
    LEFT JOIN projects ON projects.ID = aliases.projectId
    LEFT JOIN sections ON projects.ID = sections.projectId
    LEFT JOIN items ON sections.ID = items.sectionId 
    WHERE aliases.alias ilike $1
    ORDER BY sections.rank, items.rank
  `,
    [projectName]
  )
  if (projectResults.rows.length === 0) {
    return false
  }
  return R.reduce(projectRowReducer, { sections: [] }, projectResults.rows)
}

const stripEmoji = name =>
  name.startsWith(':') && name.match(/:/g).length > 1
    ? name.split(':')[2].trim()
    : name

const ignoreEmojiNameCmp = (a, b) => {
  const normA = stripEmoji(a.name.toLowerCase())
  const normB = stripEmoji(b.name.toLowerCase())
  return normA >= normB ? 1 : -1
}

export const getProjects = async () => {
  const projectResults = await pool.query('SELECT * from projects')
  projectResults.rows.sort(ignoreEmojiNameCmp)
  return projectResults.rows
}

const getProjectAliases = async projectId => {
  const aliasResults = await pool.query(
    `
    SELECT
      aliases.alias
    FROM aliases
    WHERE projectId = $1
    `,
    [projectId]
  )
  return R.pluck('alias', aliasResults.rows)
}

export const getProjectsDump = async () => {
  const projectsResults = await pool.query(
    `
    SELECT
     projects.ID as project_id,
     projects.name as project_name,
     projects.description as project_description,
     sections.ID as section_id,
     sections.name as section_name,
     sections.rank as section_rank,
     items.ID as item_id,
     items.name as item_name,
     items.url as item_url,
     items.description as item_description,
     items.rank as item_rank,
     items.type as item_type
    FROM  projects
    LEFT JOIN sections ON projects.ID = sections.projectId
    LEFT JOIN items ON sections.ID = items.sectionId
    ORDER BY projects.ID, sections.rank, items.rank
    `
  )
  const projects = R.reduce(
    (projectRows, row) => {
      if (!projectRows[row.project_id]) {
        // eslint-disable-next-line no-param-reassign
        projectRows[row.project_id] = []
      }
      projectRows[row.project_id].push(row)
      return projectRows
    },
    {},
    projectsResults.rows
  )
  const projectRetVal = await Promise.all(
    R.map(async rows => {
      return R.reduce(
        projectRowReducer,
        { sections: [], aliases: await getProjectAliases(rows[0].project_id) },
        rows
      )
    }, Object.values(projects))
  )
  return projectRetVal
}

const moveRecord = async ({ table, parentField, id, command }) => {
  const origResults = await pool.query(
    `SELECT rank, ${parentField} as parentid FROM ${table} WHERE ID = $1`,
    [id]
  )
  const parentId = origResults.rows[0].parentid
  const origRank = origResults.rows[0].rank
  const targetRank = origRank + (command === COMMANDS.up ? -1 : 1)
  const targetResults = await pool.query(
    `SELECT ID FROM ${table} WHERE ${parentField} = $1 AND rank = $2`,
    [parentId, targetRank]
  )
  const targetId = targetResults.rows[0].id
  await pool.query(`UPDATE ${table} SET rank = $1 WHERE id = $2`, [
    targetRank,
    id,
  ])
  await pool.query(`UPDATE ${table} SET rank = $1 WHERE id = $2`, [
    origRank,
    targetId,
  ])
}

export const moveSection = async (sectionId, command) => {
  return moveRecord({
    table: 'sections',
    parentField: 'projectId',
    id: sectionId,
    command,
  })
}

export const moveItem = async (itemId, command) => {
  return moveRecord({
    table: 'items',
    parentField: 'sectionId',
    id: itemId,
    command,
  })
}

const prepareRankForDelete = async (targetId, table, parentIdField) => {
  const targetResults = await pool.query(
    `SELECT rank, ${parentIdField} AS parentid FROM ${table} WHERE ID = $1`,
    [targetId]
  )
  const targetRank = targetResults.rows[0].rank
  const parentId = targetResults.rows[0].parentid

  const toModResults = await pool.query(
    `SELECT ID, rank FROM ${table} WHERE rank > $1 AND ${parentIdField} = $2`,
    [targetRank, parentId]
  )
  const records = toModResults.rows
  const updates = []
  for (let index = 0; index < records.length; index++) {
    const { id, rank } = records[index]
    updates.push(
      pool.query(`UPDATE ${table} SET rank = $1 WHERE id = $2`, [rank - 1, id])
    )
  }
  await Promise.all(updates)
}

const deleteById = async (id, table, next) => {
  // vscode claims you don't need the `await`, but you do...
  await pool.query(`DELETE FROM ${table} WHERE ID = $1`, [id], next)
}

export const deleteProject = async (projectId, next) => {
  await deleteById(projectId, 'projects', next)
  pool.query(`DELETE FROM aliases WHERE projectId = $1`, [projectId], next)
}

export const deleteSection = async sectionId => {
  await prepareRankForDelete(sectionId, 'sections', 'projectid')
  return deleteById(sectionId, 'sections')
}

export const deleteItem = async itemId => {
  await prepareRankForDelete(itemId, 'items', 'sectionid')
  return deleteById(itemId, 'items')
}

export const getSetting = async name => {
  const setting = await pool.query(`SELECT * FROM settings WHERE name = $1`, [
    name,
  ])
  return setting.rows[0]
}

export const setSetting = async (name, value) => {
  const setting = await pool.query(`SELECT * FROM settings WHERE name = $1`, [
    name,
  ])
  if (setting.rows.length) {
    await pool.query(`UPDATE settings SET value = $1 WHERE id  = $2`, [
      value,
      setting.rows[0].id,
    ])
  } else {
    await pool.query(`INSERT INTO settings (name, value) VALUES ($1, $2)`, [
      name,
      value,
    ])
  }
}

export const deleteSetting = async name => {
  await pool.query(`DELETE FROM settings WHERE name = $1`, [name])
}

export const addLookup = async ({ projectName, userId, requestType }) => {
  await pool.query(
    `INSERT INTO lookups (projectName, userId, requestType, dateTime) VALUES ($1, $2, $3, $4)`,
    [projectName.toLowerCase(), userId, requestType, new Date()]
  )
}

const getDateFromRange = range => {
  const oneDay = 1000 * 60 * 60 * 24
  const now = new Date().getTime()
  if (range) {
    return new Date(now - oneDay * range)
  }
  return new Date(1979, 1, 1)
}

export const getListingLookups = async range => {
  const sinceDate = getDateFromRange(range)
  const stats = await pool.query(
    `
    SELECT
      COUNT(lookups.id) as lookup_count,
      COUNT(DISTINCT(lookups.userId)) as user_count
    FROM lookups
    WHERE lookups.dateTime >= $1 AND lookups.projectname = ''
  `,
    [sinceDate]
  )

  return stats.rows[0]
}

export const getProjectsStats = async range => {
  const sinceDate = getDateFromRange(range)
  const stats = await pool.query(
    `
    SELECT
      projects.name as project_name,
      COUNT(lookups.id) as lookup_count,
      COUNT(DISTINCT(lookups.userId)) as user_count
    FROM projects
    LEFT JOIN aliases ON aliases.projectId = projects.id
    LEFT JOIN lookups ON lookups.projectName = aliases.alias AND lookups.dateTime >= $2
    WHERE (lookups.dateTime >= $1 OR lookups.dateTime IS NULL)
      AND projects.name IS NOT NULL
    GROUP BY project_name
    ORDER BY lookup_count DESC
  `,
    [sinceDate, sinceDate]
  )
  return stats.rows
}

export const getUserStats = async range => {
  const sinceDate = getDateFromRange(range)
  const stats = await pool.query(
    `
    SELECT
      lookups.userId as user_id,
      COUNT(lookups.id) as lookup_count,
      COUNT(DISTINCT(projects.id)) as project_count
    FROM lookups
    LEFT JOIN aliases ON lookups.projectName = aliases.alias
    LEFT JOIN projects ON aliases.projectId = projects.id
    WHERE
      (lookups.dateTime >= $1 OR lookups.dateTime IS NULL)
      AND projects.name IS NOT NULL
    GROUP BY lookups.userId
    ORDER BY lookup_count DESC
    LIMIT 5
  `,
    [sinceDate]
  )

  return stats.rows
}
