import {
  addSection,
  deleteSection,
  getSectionById,
  moveSection,
  updateSection
} from "./models";
import { postAuditMessageMaker } from "./auditing";
import { lookupProject } from "./projects";
import { COMMANDS, MESSAGES } from "./constants";
import itemModal from "./messages/item_modal";
import sectionModal from "./messages/section_modal";

const handleSectionMod = (app, convoStore) => async ({
  action,
  ack,
  context,
  body,
  respond
}) => {
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
};

const saveSection = (app, convoStore) => async ({
  ack,
  body,
  view,
  context
}) => {
  ack();
  const sectionName = view.state.values.section_name.section_name.value;
  const { id, projectId } = JSON.parse(view.private_metadata);
  const sectionId = id;

  const convo = convoStore.get(body.user.id);
  const postAuditMessage = postAuditMessageMaker(app);
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
};

export { handleSectionMod, saveSection };
