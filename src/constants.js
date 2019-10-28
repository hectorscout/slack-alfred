const ACTIONS = {
  editProject: "EDIT_PROJECT",
  itemTypeSelection: "ITEM_TYPE_SELECTION",
  modProject: "MOD_PROJECT",
  openNewProjectDialog: "OPEN_NEW_PROJECT_DIALOG",
  saveProject: "SAVE_PROJECT",
  saveSection: "SAVE_SECTION",
  saveItem: "SAVE_ITEM",
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
  newProject: {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "Mr. Wayne, are you sure Gotham can _handle_ another project now?"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: ACTIONS.openNewProjectDialog,
            text: {
              type: "plain_text",
              emoji: true,
              text: "It's the project Gotham needs"
            },
            style: "primary",
            value: "new_project"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Right as always Alfred"
            },
            style: "danger",
            value: "noop"
          }
        ]
      }
    ]
  }
};

const MODALS = {
  newSection: values => ({
    type: "modal",
    callback_id: ACTIONS.saveSection,
    private_metadata: JSON.stringify(values),
    title: {
      type: "plain_text",
      text: "Section",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "The Section Is Ready",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "I Was Just Kidding",
      emoji: true
    },
    blocks: [
      {
        type: "input",
        block_id: "section_name",
        element: {
          type: "plain_text_input",
          action_id: "section_name",
          placeholder: {
            type: "plain_text",
            text: "Bat Vehicles"
          },
          initial_value: values.name || ""
        },
        label: {
          type: "plain_text",
          text: "What section is this?"
        }
      }
    ]
  })
};

export { ACTIONS, COMMANDS, ITEM_TYPES, MESSAGES, MODALS };
