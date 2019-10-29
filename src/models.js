import * as R from "ramda";
import pool from "./config";

const updateAliases = async (aliases, projectId, projectName) => {
  try {
    await pool.query("DELETE FROM aliases WHERE projectId = $1", [projectId]);
  } catch (err) {
    console.log("handle this error deleting aliases");
  }

  const aliasList = R.map(alias => alias.trim().toLowerCase())(
    aliases.split(",")
  );
  if (!aliasList.includes(projectName.toLowerCase())) {
    aliasList.push(projectName);
  }
  R.forEach(async alias => {
    try {
      await pool.query(
        `INSERT INTO aliases (alias, projectid) VALUES ($1, $2)`,
        [alias, projectId]
      );
    } catch (err) {
      console.log("handle this error in inserting an alias");
    }
  })(aliasList);
};

export const addItem = async (name, sectionId, url, description, type) => {
  const maxRankResults = await pool.query(
    "SELECT MAX(rank) FROM items WHERE sectionId = $1",
    [sectionId]
  );
  const maxRank = maxRankResults.rows[0].max;
  const rank = maxRank === null ? 0 : maxRank + 1;
  await pool.query(
    "INSERT INTO items (name, url, description, type, sectionId, rank) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, url, description, type, sectionId, rank]
  );
};

export const addSection = async (name, projectId) => {
  const maxRankResults = await pool.query(
    "SELECT MAX(rank) FROM sections WHERE projectId = $1",
    [projectId]
  );
  const maxRank = maxRankResults.rows[0].max;
  const rank = maxRank === null ? 0 : maxRank + 1;
  await pool.query(
    "INSERT INTO sections (name, projectId, rank) VALUES ($1, $2, $3)",
    [name, projectId, rank]
  );
};

export const addProject = async (name, description, aliases) => {
  await pool.query("INSERT INTO projects (name, description) VALUES ($1, $2)", [
    name,
    description || ""
  ]);
  const idResults = await pool.query(
    "SELECT ID from projects WHERE name = $1",
    [name]
  );
  const projectId = idResults.rows[0].id;
  await addSection("Design", projectId);
  await addSection("Environments", projectId);
  await updateAliases(aliases, projectId, name);
};

export const updateItem = async (itemId, name, url, description, type) => {
  return pool.query(
    "UPDATE items set name = $1, url = $2, description = $3, type = $4 WHERE ID = $5",
    [name, url, description, type, itemId]
  );
};

export const updateSection = async (sectionId, name) => {
  return pool.query("UPDATE sections set name = $1 WHERE ID = $2", [
    name,
    sectionId
  ]);
};

export const updateProject = async (projectId, name, description, aliases) => {
  await pool.query(
    "UPDATE projects set name = $1, description = $2 WHERE ID = $3",
    [name, description, projectId]
  );
  return updateAliases(aliases, projectId, name);
};

const getById = async (table, id) => {
  const tableResult = await pool.query(`SELECT * FROM ${table} WHERE ID = $1`, [
    id
  ]);
  return tableResult.rows[0];
};

export const getItemById = async itemId => {
  return getById("items", itemId);
};

export const getSectionById = async sectionId => {
  return getById("sections", sectionId);
};

export const getProjectById = async projectId => {
  const project = await getById("projects", projectId);
  const aliasesResults = await pool.query(
    `SELECT alias FROM aliases WHERE projectid = $1`,
    [project.id]
  );
  project.aliases = R.pluck("alias", aliasesResults.rows).join(", ");
  return project;
};

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
  );
  // if (error || results.rows.length === 0) {
  //   return next(error, false);
  // }
  const project = R.reduce(
    (project, row) => {
      if (!project.id) {
        project.id = row.project_id;
      }
      if (!project.name) {
        project.name = row.project_name;
      }
      if (!project.description) {
        project.description = row.project_description;
      }
      if (!project.sections[row.section_rank]) {
        project.sections[row.section_rank] = {
          id: row.section_id,
          name: row.section_name,
          rank: row.section_rank,
          items: []
        };
      }
      if (row.item_id) {
        project.sections[row.section_rank].items.push({
          id: row.item_id,
          name: row.item_name,
          description: row.item_description,
          url: row.item_url,
          rank: row.item_rank,
          type: row.item_type
        });
      }
      return project;
    },
    { sections: [] },
    projectResults.rows
  );
  return project;
};

export const getProjects = next => {
  pool.query("SELECT * from projects", (error, results) => {
    next(results.rows);
  });
};

export const moveSection = (sectionId, command, next) => {
  try {
    pool.query(
      "SELECT rank, projectID FROM sections WHERE ID = $1",
      [sectionId],
      (error, results) => {
        if (error) {
          throw error;
        }
        const projectId = results.rows[0].projectid;
        const origRank = results.rows[0].rank;
        const targetRank = origRank + (command === "up" ? -1 : 1);
        pool.query(
          "SELECT ID FROM sections WHERE projectId = $1 AND rank = $2",
          [projectId, targetRank],
          (error, results) => {
            if (error) {
              throw error;
            }
            const targetSectionId = results.rows[0].id;
            pool.query(
              "UPDATE sections SET rank = $1 WHERE id = $2",
              [targetRank, sectionId],
              error => {
                if (error) {
                  throw error;
                }
                pool.query(
                  "UPDATE sections SET rank = $1 WHERE id = $2",
                  [origRank, targetSectionId],
                  error => {
                    if (error) {
                      throw error;
                    }
                    next();
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

export const moveItem = (itemId, command, next) => {
  try {
    pool.query(
      "SELECT rank, sectionID FROM items WHERE ID = $1",
      [itemId],
      (error, results) => {
        if (error) {
          throw error;
        }
        const sectionId = results.rows[0].sectionid;
        const origRank = results.rows[0].rank;
        const targetRank = origRank + (command === "up" ? -1 : 1);
        pool.query(
          "SELECT ID FROM items WHERE sectionId = $1 AND rank = $2",
          [sectionId, targetRank],
          (error, results) => {
            if (error) {
              throw error;
            }
            const targetItemId = results.rows[0].id;
            pool.query(
              "UPDATE items SET rank = $1 WHERE id = $2",
              [targetRank, itemId],
              error => {
                if (error) {
                  throw error;
                }
                pool.query(
                  "UPDATE items SET rank = $1 WHERE id = $2",
                  [origRank, targetItemId],
                  error => {
                    if (error) {
                      throw error;
                    }
                    next();
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

const prepareRankForDelete = (id, table, parentIdField, next) => {
  pool.query(
    `SELECT rank, ${parentIdField} AS parentid FROM ${table} WHERE ID = $1`,
    [id],
    (error, results) => {
      const targetRank = results.rows[0].rank;
      const parentId = results.rows[0].parentid;

      // TODO: handle the errors and call next after all the calls are done...
      pool.query(
        `SELECT ID, rank FROM ${table} WHERE rank > $1 AND ${parentIdField} = $2`,
        [targetRank, parentId],
        (error, results) => {
          R.map(record => {
            const { id, rank } = record;
            pool.query(
              `UPDATE ${table} SET rank = $1 WHERE id = $2`,
              [rank - 1, id],
              error => {
                if (error) {
                  throw error;
                }
              }
            );
          })(results.rows);
          next();
        }
      );
    }
  );
};

const deleteById = (id, table, next) => {
  pool.query(`DELETE FROM ${table} WHERE ID = $1`, [id], next);
};

export const deleteProject = (projectId, next) => {
  deleteById(projectId, "projects", next);
};

export const deleteSection = (sectionId, next) => {
  prepareRankForDelete(sectionId, "sections", "projectid", () => {
    deleteById(sectionId, "sections", next);
  });
};

export const deleteItem = (itemId, next) => {
  prepareRankForDelete(itemId, "items", "sectionid", () => {
    deleteById(itemId, "items", next);
  });
};
