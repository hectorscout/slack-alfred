import {
  projectsStats,
  usersStats,
  rangeSelector
} from "./messages/projects_stats";
import { getProjectsStats, getUserStats } from "./models";
import postBlocks from "./utils";
import { MESSAGES } from "./constants";

export const getStatsBlocks = async range => {
  const projectStats = await getProjectsStats(range);
  const userStats = await getUserStats(range);
  return [
    ...projectsStats(projectStats),
    ...usersStats(userStats),
    ...rangeSelector(range)
  ];
};

export const setStatsRange = app => async ({
  action,
  ack,
  respond,
  context,
  body
}) => {
  ack();
  try {
    postBlocks({
      app,
      respond,
      token: context.botToken,
      userId: body.user.id,
      blocks: await getStatsBlocks(action.selected_option.value)
    });
  } catch (err) {
    respond({
      token: context.botToken,
      response_type: "ephemeral",
      text: MESSAGES.genericError(
        `view stats for the last *${action.value}* days`
      )
    });
  }
};
