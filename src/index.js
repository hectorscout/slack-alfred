import * as R from "ramda";
import * as dotenv from "dotenv";

import { App, MemoryStore } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS } from "./constants";
import { buildProjectBlocks } from "./messages";

import {
  addProject,
  addSection,
  getFullProject,
  getProjectById,
  getProjects,
  getSectionById,
  moveItem,
  moveSection,
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
          response_type: "ephemeral", // TODO: not working?
          text: `Couldn't find ${projectName}. The following projects are available: \`${R.join(
            "`, `",
            R.pluck("projectName", projects)
          )}\``
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
        view: MODALS.newProject({}),
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
      lookupProject(command.text, false, respond, context.botToken);
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
  const projectDescription =
    view.state.values.project_description.project_description.value;
  const projectId = view.private_metadata;

  if (projectId) {
    const convo = convoStore.get(body.user.id);
    updateProject(projectId, projectName, projectDescription, error => {
      if (error) {
        // TODO
        console.log("handle this error in ACTIONS.saveProject");
      }
      convo.then(({ respond, token, projectName }) => {
        lookupProject(projectName, true, respond, token);
      });
    });
  } else {
    addProject(projectName, projectDescription, error => {
      let msg =
        "I had a bit of trouble making that new project for some reason.";
      if (!error) {
        msg = `I've create the \`${projectName}\` as you requested.
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

app.action("edit_mode", ({ action, ack, respond, context }) => {
  ack();
  lookupProject(action.value, true, respond, context.botToken);
});

app.action("mod_project", ({ action, ack, context, body, respond }) => {
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
        const blocks = MODALS.newProject(project);
        app.client.views.open({
          token: context.botToken,
          view: blocks,
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
    default:
      console.log("How did they even do this...?");
  }
});

app.action("mod_section", ({ action, ack, context, body, respond }) => {
  ack();
  const [command, projectName, sectionId] = action.selected_option.value.split(
    "_"
  );

  switch (command) {
    case "edit":
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
    case "newitem":
      // TODO
      break;
    case "up":
    case "down":
      moveSection(sectionId, command, error => {
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
  }
});

app.action("mod_item", ({ action, ack, context, body, respond }) => {
  ack();
  const [command, projectName, itemId] = action.selected_option.value.split(
    "_"
  );

  switch (command) {
    case "edit":
      // getItemById(itemId, (error, item) => {
      // const blocks = MODALS.newProject(project)
      // console.log(blocks.blocks);
      // app.client.views.open({
      //   token: context.botToken,
      //   view: blocks,
      //   trigger_id: body.trigger_id
      // });
      // });
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
  }
});
