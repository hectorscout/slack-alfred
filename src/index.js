import * as R from "ramda";
import * as dotenv from "dotenv";

import { App } from "@slack/bolt";
import { ACTIONS, MESSAGES, MODALS } from "./constants";
import { buildProjectBlocks } from "./messages";

import {
  addProject,
  getFullProject,
  getProjectById,
  getProjects,
  moveItem,
  moveSection,
  updateProject } from "./models";

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

app.view(
  ACTIONS.saveProject,
  ({ ack, body, view, context, respond, say }) => {
    ack();
    const projectName = view.state.values.project_name.project_name.value;
    const projectDescription =
      view.state.values.project_description.project_description.value;
    const projectId = view.private_metadata;
    console.log('view.......', view);

    if (projectId) {
      console.log('it exists')
      updateProject(projectId, projectName, projectDescription, error => {
        let msg =
          "I had a bit of trouble updating that project for some reason.";
        if (!error) {
          msg = `I've updated that \`${projectName}\` project. You're welcome.`;
        }
        app.client.chat.postMessage({
          token: context.botToken,
          channel: body.user.id,
          text: msg
        });
      });
    }
    else {
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

  }
);

app.action("edit_mode", ({ action, ack, respond, context }) => {
  ack();
  lookupProject(action.value, true, respond, context.botToken);
});

app.action("mod_project", ({ action, ack, context, body }) => {
  ack();
  // console.log("Edit a project", action);
  // console.log(body);
  const [command, projectName, projectId] = action.selected_option.value.split('_');

  switch (command) {
    case ('edit'):
      getProjectById(projectId, (error, project) => {
        const blocks = MODALS.newProject(project);
        app.client.views.open({
          token: context.botToken,
          view: blocks,
          trigger_id: body.trigger_id
        });
      });
      break;
    case ('newsection'):
      console.log('need to make a new section');
      break;
  }
});

app.action("mod_section", ({action, ack, context, body, respond}) => {
  ack();
  const [command, projectName, sectionId] = action.selected_option.value.split('_');

  switch (command) {
    case 'edit':
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
    case 'newitem':
      console.log('make a new item dialog');
      break;
    case 'up':
    case 'down':
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

app.action("mod_item", ({action, ack, context, body, respond}) => {
  ack();
  const [command, projectName, itemId] = action.selected_option.value.split('_');

  switch (command) {
    case 'edit':
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
    case 'up':
    case 'down':
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
