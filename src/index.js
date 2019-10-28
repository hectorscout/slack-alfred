import * as R from "ramda";
import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS, COMMANDS } from "./constants";
import { buildProjectBlocks } from "./messages";

import availableProjects from "./messages/available_projects";
import projectModal from "./messages/project_modal";
import itemModal from "./messages/item_modal";

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
        text:
          "I had some difficulty getting that project... Maybe I'll take a nap."
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
        blocks: buildProjectBlocks(project, editable)
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

app.view(ACTIONS.saveItem, ({ ack, body, view }) => {
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
    updateItem(itemId, itemName, itemUrl, itemDescription, type, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveItem", error);
      }
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  } else {
    addItem(itemName, sectionId, itemUrl, itemDescription, type, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveItem", error);
      }
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  }
});

app.view(ACTIONS.saveSection, ({ ack, body, view }) => {
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
    addSection(sectionName, projectId, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveSection", error);
      }
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  }
});

app.view(ACTIONS.saveProject, ({ ack, body, view, context }) => {
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
    addProject(name, description, aliases, error => {
      let msg =
        "I had a bit of trouble making that new project for some reason.";
      if (!error) {
        msg = `I've create *${projectName}* as you requested.
        It currently consist of a few empty default sections.
        You can view it at anytime by typing \`/alfred ${projectName}\`.
        I'd recommend that you do that now and provide some more meaningful content.`;
      }
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: msg
      });
    });
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
  const [command, projectName, projectId] = action.selected_option.value.split(
    "_"
  );

  switch (command) {
    case "edit":
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
    case "newsection":
      convoStore.set(body.user.id, {
        respond,
        token: context.botToken,
        projectName
      });
      const blocks = MODALS.newSection({ projectId });
      app.client.views.open({
        token: context.botToken,
        view: blocks,
        trigger_id: body.trigger_id
      });
      break;
    case "delete":
      deleteProject(projectId, error => {
        let msg = `I've disposed of *${projectName}* discretely. It shan't be traced back to us, sir.`;
        if (error) {
          msg =
            "I appear to have run into some problems trying to remove the project. I apologize.";
        }
        respond({
          token: context.botToken,
          response_type: "ephemeral",
          text: msg
        });
      });
    default:
      console.log("How did they even do this...?");
  }
});

app.action("mod_section", ({ action, ack, context, body, respond }) => {
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
        const blocks = MODALS.newSection(section);
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
            text:
              "I appear to have run into some problems trying to move that. I apologize."
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
            text:
              "I appear to have run into some problems trying to remove that. I apologize."
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    case COMMANDS.noop:
    default:
    // don't do anything
  }
});

app.action("mod_item", ({ action, ack, context, body, respond }) => {
  ack();
  const [command, projectName, itemId] = action.selected_option.value.split(
    "_"
  );

  switch (command) {
    case "edit":
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
    case "up":
    case "down":
      moveItem(itemId, command, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text:
              "I appear to have run into some problems trying to move that. I apologize."
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
      break;
    case "delete":
      deleteItem(itemId, error => {
        if (error) {
          respond({
            token: context.botToken,
            response_type: "ephemeral",
            text:
              "I appear to have run into some problems trying to remove that. I apologize."
          });
          return;
        }
        lookupProject(projectName, true, respond, context.botToken);
      });
  }
});
