import * as R from "ramda";
import {
  deleteSetting,
  getProjectsDump,
  getSetting,
  setSetting
} from "./models";
import { MESSAGES, SETTING_NAMES } from "./constants";
import auditPost from "./messages/audit_post";
import projectMessage from "./messages/project_message";

const postAuditMessageMaker = app => async (
  userId,
  projectName,
  changeText,
  token
) => {
  const auditChannelSetting = await getSetting(SETTING_NAMES.auditChannelId);
  if (auditChannelSetting) {
    app.client.chat.postMessage({
      token,
      channel: auditChannelSetting.value,
      blocks: auditPost(userId, projectName, changeText)
    });
  }
};

const setAuditChannel = async (respond, token, channelId, channelName) => {
  if (channelName === "directmessage") {
    return respond({
      token,
      response_type: "ephemeral",
      text: MESSAGES.auditChannel.notDM()
    });
  }
  const currentChannelId = await getSetting(SETTING_NAMES.auditChannelId);
  if (currentChannelId && currentChannelId !== channelId) {
    return respond({
      token,
      response_type: "ephemeral",
      text: MESSAGES.auditChannel.dropFirst()
    });
  }

  await setSetting(SETTING_NAMES.auditChannelId, channelId);
  return respond({
    token,
    response_type: "in-channel",
    text: MESSAGES.auditChannel.set(channelName)
  });
};

const removeAuditChannel = async (respond, token, channelId) => {
  const currentChannelSetting = await getSetting(SETTING_NAMES.auditChannelId);
  if (currentChannelSetting && currentChannelSetting.value !== channelId) {
    return respond({
      token,
      response_type: "ephemeral",
      text: MESSAGES.auditChannel.dropWrongChannel()
    });
  }
  await deleteSetting(SETTING_NAMES.auditChannelId);
  return respond({
    token,
    response_type: "in-channel",
    text: MESSAGES.auditChannel.dropped()
  });
};

const dumpProjects = async (respond, token) => {
  const projects = await getProjectsDump();
  R.map(project => {
    return respond({
      token,
      replace_original: false,
      response_type: "in_channel",
      blocks: projectMessage(project, false, true)
    });
  }, projects);
};

export {
  dumpProjects,
  postAuditMessageMaker,
  removeAuditChannel,
  setAuditChannel
};
