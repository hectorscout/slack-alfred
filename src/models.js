import * as R from 'ramda'
import { pool } from './config'

const addSection = (name, projectId, next) => {
  pool.query('INSERT INTO sections (name, projectId) VALUES ($1, $2)', ['design', projectId], (error) => {
    if (error) { throw error; }
    next();
  });
};

export const addProject = (name, description, next) => {
  try {
    pool.query('INSERT INTO projects (name, description) VALUES ($1, $2)', [name, description || ''], (error) => {
      if (error) { throw error; }
      pool.query('SELECT ID from projects WHERE name = $1', [name], (error, results) => {
        if (error) { throw error; }
        const projectId = results.rows[0].ID;
        console.log('projectId', projectId);
        addSection('design', projectId, addSection('environments', projectId, next(false)));
      });
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = (projectName, next) => {
  pool.query(`
    SELECT
     projects.ID as project_id,
     projects.name as project_name,
     projects.description as project_description,
     sections.ID as section_id,
     sections.name as section_name,
     items.ID as item_id,
     items.name as item_name,
     items.url as item_url,
     items.description as item_description
    FROM projects
    LEFT JOIN sections ON projects.ID = sections.projectId
    LEFT JOIN items ON sections.ID = items.sectionID 
    WHERE projects.name ilike $1
  `, [projectName], (error, results) =>{
    console.log('uh......', results);
    const project = R.reduce((project, row) => {
      console.log('row&&&&&&&&&&&&&&&&&&&&&&F', row);
      console.log('1111111', project);
      if (!project.id) { project.id = row.project_id }
      if (!project.name) { project.name = row.project_name }
      if (!project.description) { project.description = row.project_description }
      if (!project.sections[row.section_name]) {
        project.sections[row.section_name] = {
          id: row.section_id,
          name: row.section_name,
          items: []
        }
      }
      project.sections[row.section_name].items.push({
        id: row.item_id,
        name: row.item_name,
        description: row.item_description,
        url: row.item_url
      });
      return project;
    }, { sections: {} }, results.rows);
    console.log('end', project);
    next(error, project);
  })
};

export const getProjects = (next) => {
  pool.query('SELECT * from projects', (error, results) => {
    console.log(results.rows);
    next(results.rows);
  })
};
