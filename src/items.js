import * as R from "ramda";
import { COMMANDS, MESSAGES } from "./constants";
import {
  addItem,
  deleteItem,
  getItemById,
  moveItem,
  updateItem
} from "./models";
import { getProjectBlocks } from "./projects";
import postBlocks from "./utils";
import { postAuditMessageMaker } from "./auditing";
import itemModal from "./messages/item_modal";

const handleItemMod = (app, convoStore) => async ({
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
        postBlocks({
          app,
          blocks: await getProjectBlocks(projectName),
          respond,
          token: context.botToken,
          userId: body.user.id
        });
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
        postBlocks({
          app,
          blocks: await getProjectBlocks(projectName),
          respond,
          token: context.botToken,
          userId: body.user.id
        });
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
};

const saveItem = (app, convoStore) => async ({ ack, body, view, context }) => {
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
  const postAuditMessage = postAuditMessageMaker(app);
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
        postBlocks({
          app,
          blocks: await getProjectBlocks(projectName),
          respond,
          token,
          userId: body.user.id
        });
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
        postBlocks({
          app,
          blocks: await getProjectBlocks(projectName),
          respond,
          token,
          userId: body.user.id
        });
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
};

export { handleItemMod, saveItem };
