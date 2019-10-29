import * as R from "ramda";
import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS, COMMANDS, MESSAGES } from "./constants";

import projectMessage from "./messages/project_message";
import availableProjects from "./messages/available_projects";
import projectModal from "./messages/project_modal";
import itemModal from "./messages/item_modal";
import sectionModal from "./messages/section_modal";

import {
  addItem,
  addProject,
  addSection,
  deleteItem,
  deleteProject,
  deleteSection,
  getFullProject,
  getItemById,
  getProjectById,
  getProjects,
  getSectionById,
  moveItem,
  moveSection,
  updateItem,
  updateProject,
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

const lookupProject = (projectName, editable, respond, token) => {
  getFullProject(projectName, (error, project) => {
    if (error) {
      respond({
        token,
        response_type: "ephemeral",
        text: MESSAGES.genericError(`retrieve *${projectName}*`)
      });
      throw error;
    } else if (!project) {
      getProjects(projects => {
        respond({
          token,
          response_type: "ephemeral",
          blocks: availableProjects(projectName, projects)
        });
      });
    } else {
      respond({
        token,
        replace_original: true,
        response_type: "ephemeral",
        blocks: projectMessage(project, editable)
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
        view: projectModal({}),
        trigger_id: command.trigger_id
      });
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
    default:
      lookupProject(command.text, false, respond, context.botToken);
  }
});

app.view(ACTIONS.saveItem, async ({ ack, body, view, context }) => {
  ack();
  const { values } = view.state;
  const itemName = R.path(["item_name", "item_name", "value"], values);
  const itemUrl = R.pathOr(
    R.pathOr(
      R.path(["item_user", "item_user", "selected_user"], values),
      ["item_url", "item_url", "value"],
      values
    ),
    ["item_channel", "item_channel", "selected_channel"],
    values
  );
  const itemDescription = R.path(
    ["item_description", "item_description", "value"],
    values
  );
  const { id, sectionId, type } = JSON.parse(view.private_metadata);
  const itemId = id;

  const convo = convoStore.get(body.user.id);
  if (itemId) {
    try {
      await updateItem(itemId, itemName, itemUrl, itemDescription, type);
      convo.then(({respond, token, projectName}) => {
        lookupProject(projectName, true, respond, token);
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
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
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

app.view(ACTIONS.saveSection, async ({ ack, body, view }) => {
  ack();
  const sectionName = view.state.values.section_name.section_name.value;
  const { id, projectId } = JSON.parse(view.private_metadata);
  const sectionId = id;

  const convo = convoStore.get(body.user.id);
  if (sectionId) {
    updateSection(sectionId, sectionName, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveSection", error);
      }
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  } else {
    try {
      await addSection(sectionName, projectId);
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    } catch (err) {
      console.log("error in ACTIONS.saveSection", error);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("add that new section")
      });
    }
  }
});

app.view(ACTIONS.saveProject, async ({ ack, body, view, context }) => {
  ack();

  const projectName = view.state.values.project_name.project_name.value;
  const description =
    view.state.values.project_description.project_description.value;
  const aliases = view.state.values.project_aliases.project_aliases.value;
  const id = view.private_metadata;

  if (id) {
    const convo = convoStore.get(body.user.id);
    updateProject(id, projectName, description, aliases, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveProject");
      }
      convo.then(({ respond, token }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  } else {
    try {
      await addProject(projectName, description, aliases);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.addProjectSuccess(projectName)
      });
    } catch (err) {
      console.log("error in ACTIONS.saveProject", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("make that new project")
      });
    }
  }
});

app.action(ACTIONS.editProject, ({ action, ack, respond, context }) => {
  ack();
  lookupProject(action.value, true, respond, context.botToken);
});

app.action(ACTIONS.viewProject, ({ action, ack, respond, context }) => {
  ack();
  lookupProject(action.value, false, respond, context.botToken);
});

app.action(ACTIONS.modProject, ({ action, ack, context, body, respond }) => {
  ack();
  const actionValues = JSON.parse(action.selected_option.value);
  const command = actionValues.cmd;
  const projectName = actionValues.pn;
  const projectId = actionValues.pId;

  switch (command) {
    case COMMANDS.edit:
      convoStore.set(body.user.id, {
        respond,
        token: context.botToken,
        projectName
      });
      getProjectById(projectId, (error, project) => {
        app.client.views.open({
          token: context.botToken,
          view: projectModal(project),
          trigger_id: body.trigger_id
        });
      });
      break;
    case COMMANDS.new:
      convoStore.set(body.user.id, {
        respond,
        token: context.botToken,
        projectName
      });
      const blocks = sectionModal({ projectId });
      app.client.views.open({
        token: context.botToken,
        view: blocks,
        trigger_id: body.trigger_id
      });
      break;
    case COMMANDS.delete:
      deleteProject(projectId, error => {
        let msg = MESSAGES.removeProjectSuccess(projectName);
        if (error) {
          msg = MESSAGES.genericError("remove that");
        }
        respond({
          token: context.botToken,
          response_type: "ephemeral",
          text: msg
        });
      });
    case COMMANDS.noop:
      break;
    default:
      console.log("How did they even do this...?");
  }
});

app.action(ACTIONS.modSection, ({ action, ack, context, body, respond }) => {
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
      getSectionById(sectionId, (error, section) => {
        const blocks = sectionModal(section);
        app.client.views.open({
          token: context.botToken,
          view: blocks,
          trigger_id: body.trigger_id
        });
      });
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
      const direction = command === COMMANDS.up ? "up" : "down";
      moveSection(sectionId, direction, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("move that")
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    case COMMANDS.delete:
      deleteSection(sectionId, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("remove that")
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    case COMMANDS.noop:
      break;
    default:
      console.log("Shouldn't be able to do this...");
  }
});

app.action(ACTIONS.modItem, ({ action, ack, context, body, respond }) => {
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
      getItemById(itemId, (error, item) => {
        const blocks = itemModal(item);
        app.client.views.open({
          token: context.botToken,
          view: blocks,
          trigger_id: body.trigger_id
        });
      });
      break;
    case COMMANDS.up:
    case COMMANDS.down:
      moveItem(itemId, command, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("move that")
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    case COMMANDS.delete:
      deleteItem(itemId, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text: MESSAGES.genericError("remove that")
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    default:
      console.log("Shouldn't be able to do this...");
  }
});
