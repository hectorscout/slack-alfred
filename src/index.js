import * as dotenv from "dotenv";

import { App } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS } from "./constants";

dotenv.config();

console.log(process.env.SLACK_SIGNING_SECRET);
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
      respond({ text: "Something about help here" });
    default:
      respond({ text: "Something about help here" });
  }
});

app.view(ACTIONS.createNewProject, ({ ack, body, view, context }) => {
  ack()
  console.log('got a modal', view);
  const projectName = view.state.values['project_name']['project_name'].value;
  const projectDescription = view.state.values['project_description']['project_description'].value;
  
})
