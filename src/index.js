import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS } from "./constants";

import { dumpProjects, removeAuditChannel, setAuditChannel } from "./auditing";

import {
  editProject,
  handleProjectMod,
  lookupProject,
  newProjectView,
  newProjectViewForAction,
  saveProject,
  viewProject
} from "./projects";

import { handleSectionMod, saveSection } from "./sections";

import { handleItemMod, saveItem } from "./items";

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_ACCESS_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const convoStore = new MemoryStore();

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Bolt app is running on port ${port}`);
})();

app.command("/alfred", async ({ command, ack, respond, context, body }) => {
  ack();
  const method = command.text.split(" ")[0].toUpperCase();

  switch (method) {
    case "NEW":
      newProjectView(app, context.botToken, command.trigger_id);
      break;
    // case "HELP":
    //   getProjects(projects => {
    //     respond({
    //       text: `The following projects are available: \`${R.join(
    //         "`, `",
    //         R.pluck("name", projects)
    //       )}\``
    //     });
    //   });
    //   break;
    case "AUDITDUMP":
      await dumpProjects(respond, context.botToken);
      break;
    case "AUDITCHANNEL":
      await setAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      );
      break;
    case "RELEASEAUDIT":
      await removeAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      );
      break;
    default:
      await lookupProject(command.text, false, respond, context.botToken);
  }
});

app.view(ACTIONS.saveItem, saveItem(app, convoStore));

app.view(ACTIONS.saveSection, saveSection(app, convoStore));

app.view(ACTIONS.saveProject, saveProject(app, convoStore));

app.action(ACTIONS.openNewProjectDialog, newProjectViewForAction(app));

app.action(ACTIONS.editProject, editProject);

app.action(ACTIONS.viewProject, viewProject);

app.action(ACTIONS.modProject, handleProjectMod(app, convoStore));

app.action(ACTIONS.modSection, handleSectionMod(app, convoStore));

app.action(ACTIONS.modItem, handleItemMod(app, convoStore));
