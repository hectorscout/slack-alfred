import projectsStats from "./messages/projects_stats";
import { getProjectsStats } from "./models";
import postBlocks from "./utils";
import { MESSAGES } from "./constants";

export const getStatsBlocks = async range => {
  const stats = await getProjectsStats(range);
  return projectsStats(stats, range);
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
      blocks: projectsStats(
        await getProjectsStats(action.selected_option.value),
        action.selected_option.value
      )
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
