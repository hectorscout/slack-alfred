import { pool } from './config'

export const addProject = (name, description, next) => {
  pool.query('INSERT INTO projects (name, description) VALUES ($1, $2)', [name, description || ''], error => {
    next(error)
  })
}

export const getProject = (projectName, next) => {
  pool.query('SELECT * from projects WHERE name ilike $1', [projectName], (error, results) =>{
    next(error, results)
  })
}

export const getProjects = (next) => {
  pool.query('SELECT * from projects', (error, results) => {
    console.log(results.rows);
    next(results.rows);
  })
}
