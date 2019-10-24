import * as R from "ramda";
import * as dotenv from "dotenv";

import { App } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS } from "./constants";
import { buildProjectBlocks } from "./messages";

import { addProject, getProject, getProjects } from "./models";

dotenv.config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_ACCESS_TOKEN
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Bolt app is running on port ${port}`);
})();

const lookupProject = (projectName, respond) => {
  getProject(projectName, (error, project) => {
    if (error) {
      respond({
        response_type: "ephemeral",
        text:
          "I had some difficulty getting that project... Maybe I'll take a nap."
      });
      throw error;
    } else if (!project) {
      getProjects(projects => {
        respond({
          response_type: "ephemeral", // TODO: not working?
          text: `Couldn't find ${projectName}. The following projects are available: \`${R.join(
            "`, `",
            R.pluck("projectName", projects)
          )}\``
        });
      });
    } else {
      respond({
        response_type: "ephemeral",
        blocks: buildProjectBlocks(project)
      });
    }
  });
};

app.command("/alfred", ({ command, ack, respond, context }) => {
  ack();
  const method = command.text.split(" ")[0].toUpperCase();

  switch (method) {
    case "NEW":
      app.client.views.open({
        token: context.botToken,
        view: MODALS.newProject,
        trigger_id: command.trigger_id
      });
      break;
    case "HELP":
      getProjects(projects => {
        respond({
          text: `The following projects are available: \`${R.join(
            "`, `",
            R.pluck("name", projects)
          )}\``
        });
      });
      break;
    default:
      lookupProject(command.text, respond);
  }
});

app.view(
  ACTIONS.createNewProject,
  ({ ack, body, view, context, respond, say }) => {
    ack();
    console.log("got a modal", view);
    console.log("body", body);
    const projectName = view.state.values.project_name.project_name.value;
    const projectDescription =
      view.state.values.project_description.project_description.value;

    addProject(projectName, projectDescription, error => {
      let msg =
        "I had a bit of trouble making that new project for some reason.";
      if (!error) {
        msg = `I made that project. You know, "${projectName}"`;
      }
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: msg
      });
    });
  }
);
