const ACTIONS = {
  editProject: "EDIT_PROJECT",
  itemTypeSelection: "ITEM_TYPE_SELECTION",
  modItem: "MOD_ITEM",
  modProject: "MOD_PROJECT",
  modSection: "MOD_SECTION",
  openNewProjectDialog: "OPEN_NEW_PROJECT_DIALOG",
  saveItem: "SAVE_ITEM",
  saveProject: "SAVE_PROJECT",
  saveSection: "SAVE_SECTION",
  viewProject: "VIEW_PROJECT"
};

const COMMANDS = {
  edit: "E",
  new: "N",
  up: "U",
  down: "D",
  delete: "X",
  noop: "0"
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
    return `I've disposed of *${projectName}* discretely. It shan't be traced back to us, sir.`
  },
  genericError: doThing => {
    return `I appear to have run into some problems trying to ${doThing}. I apologize.`
  }
};

export { ACTIONS, COMMANDS, ITEM_TYPES, MESSAGES };
