import * as R from "ramda";
import pool from "./config";

const addSection = (name, projectId, next) => {
  pool.query(
    "SELECT MAX(rank) FROM sections WHERE projectId = $1",
    [projectId],
    (error, results) => {
      if (error) {
        throw error;
      }
      const maxRank = results.rows[0].max;
      const rank = maxRank === null ? 0 : maxRank + 1;
      pool.query(
        "INSERT INTO sections (name, projectId, rank) VALUES ($1, $2, $3)",
        [name, projectId, rank],
        error => {
          if (error) {
            throw error;
          }
          next();
        }
      );
    }
  );
};

export const addProject = (name, description, next) => {
  try {
    pool.query(
      "INSERT INTO projects (name, description) VALUES ($1, $2)",
      [name, description || ""],
      error => {
        if (error) {
          throw error;
        }
        pool.query(
          "SELECT ID from projects WHERE name = $1",
          [name],
          (error, results) => {
            if (error) {
              throw error;
            }
            const projectId = results.rows[0].id;
            addSection("Design", projectId, () =>
              addSection("Environments", projectId, next)
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

export const updateProject = (projectId, name, description, next) => {
  pool.query(
    "UPDATE projects set name = $1, description = $2 WHERE ID = $3",
    [name, description, projectId],
    next
  );
};

export const getProjectById = (projectId, next) => {
  pool.query(
    `SELECT * FROM projects WHERE ID = $1`,
    [projectId],
    (error, results) => {
      if (error) {
        return next(error);
      }
      return next(null, results.rows[0]);
    }
  );
};

export const getFullProject = (projectName, next) => {
  pool.query(
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
     items.rank as item_rank
    FROM projects
    LEFT JOIN sections ON projects.ID = sections.projectId
    LEFT JOIN items ON sections.ID = items.sectionId 
    WHERE projects.name ilike $1
    ORDER BY sections.rank, items.rank
  `,
    [projectName],
    (error, results) => {
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
              rank: row.item_rank
            });
          }
          return project;
        },
        { sections: [] },
        results.rows
      );
      next(error, project);
    }
  );
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
