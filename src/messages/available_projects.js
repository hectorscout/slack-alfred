import * as R from "ramda";
import { ACTIONS, MESSAGES } from "../constants";

const availableProjects = (unfoundProjectName, projects) => {
  let introText = unfoundProjectName ? MESSAGES.unfoundProject(unfoundProjectName) : MESSAGES.basicIntro();

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

  if (unfoundProjectName) {
    blocks.push({ type: "divider"});
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: MESSAGES.addAliasPrompt(unfoundProjectName)
      }
    });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: MESSAGES.addNew()
      },
      accessory: {
        type: "button",
        action_id: ACTIONS.openNewProjectDialog,
        text: {
          type: "plain_text",
          emoji: true,
          text: "New Project"
        }
      }
    })
  }

  return blocks;
};

export default availableProjects;
