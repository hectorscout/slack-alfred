import * as R from 'ramda';
import * as dotenv from "dotenv";
dotenv.config();

import { App } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS } from "./constants";

import { addProject, getProject, getProjects } from "./models";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_ACCESS_TOKEN
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Bolt app is running on port ${port}`);
})();

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
      getProjects((projects) => {
        respond({text: `The following projects are available: \`${R.join('\`, \`', R.pluck('name', projects))}\``});
      });
      break;
    default:
      getProject(command.text, (error, results) => {
        console.log('projects', results)
        if (error) {
          respond({text: "I had some difficulty getting that project... Maybe I'll take a nap."})
          throw error;
        }
        else if (!results.rows.length) {
          getProjects((projects) => {
            respond({text: `Couldn't find ${command.text}. The following projects are available: \`${R.join('\`, \`', R.pluck('name', projects))}\``});
          });
        }
        else {
          respond({text: `Got these projects: \`${R.join('\`, \`', R.pluck('name', results.rows))}\``});
        }
      });
  }
});

app.view(ACTIONS.createNewProject, ({ ack, body, view, context, respond, say }) => {
  ack()
  console.log('got a modal', view);
  console.log('body', body);
  const projectName = view.state.values['project_name']['project_name'].value;
  const projectDescription = view.state.values['project_description']['project_description'].value;

  addProject(projectName, projectDescription, (error) => {
    let msg = 'I had a bit of trouble making that new project for some reason.';
    if (!error) {
      msg = `I made that project. You know, "${projectName}"`
    }
    app.client.chat.postMessage({
      token: context.botToken,
      channel: body['user']['id'],
      text: msg,
    });
  })
})
