import * as R from "ramda";
import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS, COMMANDS, MESSAGES } from "./constants";

import availableProjects from "./messages/available_projects";
import itemModal from "./messages/item_modal";
import sectionModal from "./messages/section_modal";
import {
  dumpProjects,
  postAuditMessageMaker,
  removeAuditChannel,
  setAuditChannel
} from "./auditing";

import {
  editProject,
  handleProjectMod,
  lookupProject,
  newProjectView,
  newProjectViewForAction,
  saveProject,
  viewProject
} from "./projects";

import {
  addItem,
  addSection,
  deleteItem,
  deleteSection,
  getItemById,
  getProjects,
  getSectionById,
  moveItem,
  moveSection,
  updateItem,
  updateSection
} from "./models";

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

const postAuditMessage = postAuditMessageMaker(app);

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

app.view(ACTIONS.saveItem, async ({ ack, body, view, context }) => {
  ack();
  const { values } = view.state;
  const itemName = R.pathOr("", ["item_name", "item_name", "value"], values);
  const itemUrl =
    R.path(["item_url", "item_url", "value"], values) ||
    R.path(["item_user", "item_user", "selected_user"], values) ||
    R.path(["item_channel", "item_channel", "selected_channel"], values);
  const itemDescription = R.pathOr(
    "",
    ["item_description", "item_description", "value"],
    values
  );

  const { id, sectionId, type } = JSON.parse(view.private_metadata);
  const itemId = id;

  const convo = convoStore.get(body.user.id);
  if (itemId) {
    try {
      await updateItem(itemId, itemName, itemUrl, itemDescription, type);
      convo.then(async ({ respond, token, projectName }) => {
        postAuditMessage(
          body.user.id,
          projectName,
          `${itemName}: ${itemUrl}, ${itemDescription}`,
          context.botToken
        );
        await lookupProject(projectName, true, respond, token);
      });
    } catch (err) {
      console.log("error in ACTIONS.saveItem (updateItem)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("update that item")
      });
    }
  } else {
    try {
      await addItem(itemName, sectionId, itemUrl, itemDescription, type);
      convo.then(async ({ respond, token, projectName }) => {
        postAuditMessage(
          body.user.id,
          projectName,
          `${itemName}: ${itemUrl}, ${itemDescription}`,
          context.botToken
        );
        await lookupProject(projectName, true, respond, token);
      });
    } catch (err) {
      console.log("error in ACTIONS.saveItem (addItem)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("add that new item")
      });
    }
  }
});

app.view(ACTIONS.saveSection, async ({ ack, body, view, context }) => {
  ack();
  const sectionName = view.state.values.section_name.section_name.value;
  const { id, projectId } = JSON.parse(view.private_metadata);
  const sectionId = id;

  const convo = convoStore.get(body.user.id);
  if (sectionId) {
    try {
      await updateSection(sectionId, sectionName);
      convo.then(async ({ respond, token, projectName }) => {
        postAuditMessage(
          body.user.id,
          projectName,
          sectionName,
          context.botToken
        );
        await lookupProject(projectName, true, respond, token);
      });
    } catch (err) {
      console.log("error in ACTIONS.saveSection (updateSection)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("update that section")
      });
    }
  } else {
    try {
      await addSection(sectionName, projectId);
      convo.then(async ({ respond, token, projectName }) => {
        postAuditMessage(
          body.user.id,
          projectName,
          sectionName,
          context.botToken
        );
        await lookupProject(projectName, true, respond, token);
      });
    } catch (err) {
      console.log("error in ACTIONS.saveSection (addSection)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("add that new section")
      });
    }
  }
});

app.view(ACTIONS.saveProject, saveProject(app, convoStore));

app.action(ACTIONS.openNewProjectDialog, newProjectViewForAction(app));

app.action(ACTIONS.editProject, editProject);

app.action(ACTIONS.viewProject, viewProject);

app.action(ACTIONS.modProject, handleProjectMod(app, convoStore));

app.action(
  ACTIONS.modSection,
  async ({ action, ack, context, body, respond }) => {
    ack();
    const actionValue = JSON.parse(action.selected_option.value);
    const command = actionValue.cmd;
    const projectName = actionValue.pn;
    const sectionId = actionValue.sId;

    switch (command) {
      case COMMANDS.edit:
        convoStore.set(body.user.id, {
          respond,
          token: context.botToken,
          projectName
        });
        try {
          const section = await getSectionById(sectionId);
          const blocks = sectionModal(section);
          app.client.views.open({
            token: context.botToken,
            view: blocks,
            trigger_id: body.trigger_id
          });
        } catch (err) {
          console.log("error in ACTIONS.modSection (edit)", err);
          app.client.chat.postMessage({
            token: context.botToken,
            channel: body.user.id,
            text: MESSAGES.genericError("edit that section")
          });
        }
        break;
      case COMMANDS.new:
        convoStore.set(body.user.id, {
          respond,
          token: context.botToken,
          projectName
        });
        app.client.views.open({
          token: context.botToken,
          view: itemModal({ sectionId, type: actionValue.type }),
          trigger_id: body.trigger_id
        });
        break;
      case COMMANDS.up:
      case COMMANDS.down:
        try {
          await moveSection(sectionId, command);
          await lookupProject(projectName, true, respond, context.botToken);
        } catch (err) {
          console.log("error in ACTIONS.modSection (move)", err);
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("move that")
          });
        }
        break;
      case COMMANDS.delete:
        try {
          await deleteSection(sectionId);
          await lookupProject(projectName, true, respond, context.botToken);
        } catch (err) {
          console.log("error in ACTIONS.modSection (delete)", err);
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("remove that")
          });
        }
        break;
      case COMMANDS.noop:
        break;
      default:
        console.log("Shouldn't be able to do this...");
    }
  }
);

app.action(ACTIONS.modItem, async ({ action, ack, context, body, respond }) => {
  ack();
  const actionValue = JSON.parse(action.selected_option.value);
  const command = actionValue.cmd;
  const projectName = actionValue.pn;
  const itemId = actionValue.iId;

  switch (command) {
    case COMMANDS.edit:
      convoStore.set(body.user.id, {
        respond,
        token: context.botToken,
        projectName
      });
      try {
        const item = await getItemById(itemId);
        const blocks = itemModal(item);
        app.client.views.open({
          token: context.botToken,
          view: blocks,
          trigger_id: body.trigger_id
        });
      } catch (err) {
        console.log("error in ACTIONS.modItem (edit)", err);
        app.client.chat.postMessage({
          token: context.botToken,
          channel: body.user.id,
          text: MESSAGES.genericError("edit that item")
        });
      }
      break;
    case COMMANDS.up:
    case COMMANDS.down:
      try {
        await moveItem(itemId, command);
        await lookupProject(projectName, true, respond, context.botToken);
      } catch (err) {
        console.log("error in ACTIONS.modItem (move)", err);
        respond({
          token: context.botToken,
          response_type: "ephemeral",
          text: MESSAGES.genericError("move that")
        });
      }
      break;
    case COMMANDS.delete:
      try {
        await deleteItem(itemId);
        await lookupProject(projectName, true, respond, context.botToken);
      } catch (err) {
        console.log("error in ACTIONS.modItem (delete)", err);
        respond({
          token: context.botToken,
          response_type: "ephemeral",
          text: MESSAGES.genericError("delete that")
        });
      }
      break;
    default:
      console.log("Shouldn't be able to do this...");
  }
});
