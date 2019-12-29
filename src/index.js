import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS, SLASH_COMMAND } from "./constants";

import handleSlashCommand from "./slash_command";

import {
  editProject,
  handleProjectMod,
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

app.command(SLASH_COMMAND, handleSlashCommand(app));

app.view(ACTIONS.saveItem, saveItem(app, convoStore));
app.view(ACTIONS.saveSection, saveSection(app, convoStore));
app.view(ACTIONS.saveProject, saveProject(app, convoStore));

app.action(ACTIONS.openNewProjectDialog, newProjectViewForAction(app));
app.action(ACTIONS.editProject, editProject);
app.action(ACTIONS.viewProject, viewProject);
app.action(ACTIONS.modProject, handleProjectMod(app, convoStore));
app.action(ACTIONS.modSection, handleSectionMod(app, convoStore));
app.action(ACTIONS.modItem, handleItemMod(app, convoStore));
