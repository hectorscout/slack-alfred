import {
  addProject,
  deleteProject,
  getFullProject,
  getProjectById,
  getProjects,
  updateProject
} from "./models";
import { COMMANDS, MESSAGES } from "./constants";
import { postAuditMessageMaker } from "./auditing";
import availableProjects from "./messages/available_projects";
import projectMessage from "./messages/project_message";
import projectModal from "./messages/project_modal";
import sectionModal from "./messages/section_modal";

import postBlocks from "./utils";

const getProjectBlocks = async (projectName, editable = true) => {
  let blocks;
  const project = await getFullProject(projectName);
  if (!project) {
    const projects = await getProjects();
    blocks = availableProjects(projectName, projects);
  } else {
    blocks = projectMessage(project, editable);
  }
  return blocks;
};

const saveProject = (app, convoStore) => async ({
  ack,
  body,
  view,
  context
}) => {
  ack();
  const postAuditMessage = postAuditMessageMaker(app);
  const projectName = view.state.values.project_name.project_name.value;
  const description =
    view.state.values.project_description.project_description.value;
  const aliases = view.state.values.project_aliases.project_aliases.value;
  const id = view.private_metadata;

  if (id) {
    const convo = convoStore.get(body.user.id);
    try {
      await updateProject(id, projectName, description, aliases);
      convo.then(async ({ respond, token }) => {
        postAuditMessage(
          body.user.id,
          projectName,
          `${aliases}\n${description}`,
          context.botToken
        );
        postBlocks({
          app,
          respond,
          token,
          userId: body.user.id,
          blocks: await getProjectBlocks(projectName, true)
        });
      });
    } catch (err) {
      console.log("error in ACTIONS.saveProject (updateProject)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("make that new project")
      });
    }
  } else {
    try {
      await addProject(projectName, description, aliases);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.addProjectSuccess(projectName)
      });
      postAuditMessage(
        body.user.id,
        projectName,
        `${aliases}\n${description}`,
        context.botToken
      );
    } catch (err) {
      console.log("error in ACTIONS.saveProject (addProject)", err);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: body.user.id,
        text: MESSAGES.genericError("make that new project")
      });
    }
  }
};

const newProjectView = (app, token, triggerId) => {
  app.client.views.open({
    token,
    view: projectModal({}),
    trigger_id: triggerId
  });
};

const newProjectViewForAction = app => ({ ack, body, context }) => {
  ack();
  newProjectView(app, context.botToken, body.trigger_id);
};

const editProject = app => async ({ action, ack, respond, context, body }) => {
  ack();
  try {
    postBlocks({
      app,
      respond,
      token: context.botToken,
      userId: body.user.id,
      blocks: await getProjectBlocks(action.value, true)
    });
  } catch (err) {
    respond({
      token: context.botToken,
      response_type: "ephemeral",
      text: MESSAGES.genericError(`edit *${action.value}*`)
    });
  }
};

const listProjects = app => async ({ ack, respond, context, body }) => {
  ack();
  try {
    postBlocks({
      app,
      respond,
      token: context.botToken,
      userId: body.user.id,
      blocks: await getProjectBlocks("", false)
    });
  } catch (err) {
    respond({
      token: context.botToken,
      response_type: "ephemeral",
      text: MESSAGES.genericError(`list projects`)
    });
  }
};

const viewProject = app => async ({ action, ack, respond, context, body }) => {
  ack();
  try {
    postBlocks({
      app,
      respond,
      token: context.botToken,
      userId: body.user.id,
      blocks: await getProjectBlocks(action.value, false)
    });
  } catch (err) {
    respond({
      token: context.botToken,
      response_type: "ephemeral",
      text: MESSAGES.genericError(`edit *${action.value}*`)
    });
  }
};

const handleProjectMod = (app, convoStore) => async ({
  action,
  ack,
  context,
  body,
  respond
}) => {
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
      try {
        const project = await getProjectById(projectId);
        app.client.views.open({
          token: context.botToken,
          view: projectModal(project),
          trigger_id: body.trigger_id
        });
      } catch (err) {
        console.log("error in ACTIONS.modProject (edit)", err);
        app.client.chat.postMessage({
          token: context.botToken,
          channel: body.user.id,
          text: MESSAGES.genericError("edit that project")
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
        view: sectionModal({ projectId }),
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
      break;
    case COMMANDS.noop:
      break;
    default:
      console.log("How did they even do this...?");
  }
};

export {
  editProject,
  getProjectBlocks,
  handleProjectMod,
  listProjects,
  newProjectView,
  newProjectViewForAction,
  saveProject,
  viewProject
};
