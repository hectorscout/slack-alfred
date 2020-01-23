import projectsStats from "./messages/projects_stats";
import { getProjectsStats } from "./models";

export const getStatsBlocks = async () => {
  const stats = await getProjectsStats();
  return projectsStats(stats);
};
