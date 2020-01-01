const SLASH_COMMAND = "/alfred";

const MAX_TEXT_INPUT_LENGTH = 255;

const ACTIONS = {
  editProject: "EDIT_PROJECT",
  itemTypeSelection: "ITEM_TYPE_SELECTION",
  listProjects: "LIST_PROJECTS",
  modItem: "MOD_ITEM",
  modProject: "MOD_PROJECT",
  modSection: "MOD_SECTION",
  openNewProjectDialog: "OPEN_NEW_PROJECT_DIALOG",
  saveItem: "SAVE_ITEM",
  saveProject: "SAVE_PROJECT",
  saveSection: "SAVE_SECTION",
  viewProject: "VIEW_PROJECT"
};

const EVENTS = {
  appHomeOpened: "app_home_opened"
};

const COMMANDS = {
  edit: "E",
  new: "N",
  up: "U",
  down: "D",
  delete: "X",
  noop: "0"
};

const ICONS = {
  addNewLink: ":alfred_add_new_link:",
  addNewUser: ":alfred_add_new_user:",
  addNewChannel: ":alfred_add_new_channel:",
  addNewSection: ":alfred_add_new_section:",
  edit: ":alfred_edit:",
  moveUp: ":alfred_move_up:",
  moveDown: ":alfred_move_down:",
  delete: ":alfred_delete:",
  updateButton: ":alfred_batsymbol:"
};

const ITEM_TYPES = {
  url: "URL",
  user: "USER",
  channel: "CHANNEL"
};

const MESSAGES = {
  addProjectSuccess: projectName => {
    return `I've create *${projectName}* as you requested.
    It currently consist of a few empty default sections.
    You can view it at anytime by typing \`/alfred ${projectName}\`.
    I'd recommend that you do that now and provide some more meaningful content.`;
  },
  removeProjectSuccess: projectName => {
    return `I've disposed of *${projectName}* discretely. It shan't be traced back to us, sir.`;
  },
  genericError: doThing => {
    return `I appear to have run into some problems trying to ${doThing}. I apologize.`;
  },
  unfoundProject: unfoundProjectName => {
    return `I'm sorry Master Bruce, but the Bat-Computer doesn't currently have a file on *${unfoundProjectName}*.
    Perhaps you'd be interested in one of these projects?`;
  },
  basicIntro: () => {
    return "Ah Master Bruce, which of the projects in the Bat Computer would you like to access?";
  },
  addAliasPrompt: unfoundProjectName => {
    return `If you feel that the bat computer should have found one of the above files, you might consider adding *${unfoundProjectName}* to that project's list of aliases.`;
  },
  addNew: () => {
    return `Or maybe you would like to create a new file?`;
  },
  auditChannel: {
    notDM: () => {
      return `You should probably set an audit _channel_ instead of a DM with you, sir.
      Might I suggest a new private channel named something to the tune of \`alfred-audit\`, perhaps?`;
    },
    dropFirst: () => {
      return `If you'd like to change the audit channel you'll first need to run \`\\alfred releaseaudit\` in the current audit channel.`;
    },
    set: channelName => {
      return `The audit channel has been set to #${channelName}, as you requested.`;
    },
    dropWrongChannel: () => {
      return `I'm sorry Master Bruce, but this isn't the audit channel. You'll need to run \`\\alfred releaseaudit\` in the current audit channel.
      If the current audit channel no longer exists, or you don't remember which it was, I'm afraid you may need to update the DB manually.
      It's for security, sir.`;
    },
    dropped: () => {
      return `I've released the audit channel. You're now free to designate another channel as the audit channel. Choose wisely.`;
    }
  }
};

const SETTING_NAMES = {
  auditChannelId: "AUDIT_CHANNEL_ID"
};

const BLOCKS = {
  text: text => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text
    }
  }),
  option: (text, value) => ({
    text: {
      type: "plain_text",
      emoji: true,
      text
    },
    value: JSON.stringify(value)
  }),
  divider: () => ({
    type: "divider"
  }),
  button: (actionId, text, style, value) => ({
    type: "button",
    action_id: actionId,
    text: {
      type: "plain_text",
      emoji: true,
      text
    },
    style,
    value: `${value}`
  }),
  dropdown: (actionId, options, placeholder) => ({
    type: "static_select",
    action_id: actionId,
    options,
    placeholder: {
      type: "plain_text",
      emoji: true,
      text: `${placeholder}`
    }
  })
};

export {
  ACTIONS,
  BLOCKS,
  COMMANDS,
  EVENTS,
  ICONS,
  ITEM_TYPES,
  MAX_TEXT_INPUT_LENGTH,
  MESSAGES,
  SETTING_NAMES,
  SLASH_COMMAND
};
