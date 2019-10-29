import * as R from "ramda";
import { ACTIONS, MESSAGES } from "../constants";

const availableProjects = (unfoundProjectName, projects) => {
  let introText =
    "Ah Master Bruce, which of the projects in the Bat Computer would you like to access?";
  if (unfoundProjectName) {
    introText = `I'm sorry Master Bruce, but the Bat-Computer doesn't currently have a file on *${unfoundProjectName}*.\nPerhaps you'd be interested in one of these projects?`;
  }

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: introText
      }
    },
    {
      type: "divider"
    }
  ];

  R.forEach(project => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${project.name}*\n${project.description}`
      },
      accessory: {
        type: "button",
        action_id: ACTIONS.viewProject,
        text: {
          type: "plain_text",
          emoji: true,
          text: "View"
        },
        value: project.name
      }
    });
  })(projects);

  return blocks;
};

export default availableProjects;
