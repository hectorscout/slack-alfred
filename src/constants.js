const ACTIONS = {
  editProject: "EDIT_PROJECT",
  modProject: "MOD_PROJECT",
  openNewProjectDialog: "OPEN_NEW_PROJECT_DIALOG",
  saveProject: "SAVE_PROJECT",
  saveSection: "SAVE_SECTION",
  saveItem: "SAVE_ITEM",
  viewProject: 'VIEW_PROJECT',

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
  }),
  newItem: values => ({
    type: "modal",
    callback_id: ACTIONS.saveItem,
    private_metadata: JSON.stringify(values),
    title: {
      type: "plain_text",
      text: "Alfred",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "That'll Do",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Forget It",
      emoji: true
    },
    blocks: [
      {
        type: "input",
        block_id: "item_name",
        element: {
          type: "plain_text_input",
          action_id: "item_name",
          placeholder: {
            type: "plain_text",
            text: "The Batmobile"
          },
          initial_value: values.name || ""
        },
        label: {
          type: "plain_text",
          text: "What is this item called?"
        }
      },
      {
        type: "input",
        block_id: "item_url",
        element: {
          type: "plain_text_input",
          action_id: "item_url",
          placeholder: {
            type: "plain_text",
            text: "http://en.wikipedia.org/wiki/Batmobile"
          },
          initial_value: values.url || ""
        },
        label: {
          type: "plain_text",
          text: "Where would one find this item?"
        }
      },
      {
        type: "input",
        block_id: "item_description",
        label: {
          type: "plain_text",
          text: "And a bit more of a description?",
          emoji: true
        },
        element: {
          type: "plain_text_input",
          action_id: "item_description",
          placeholder: {
            type: "plain_text",
            text:
              "A heavily armored armored tactical assault vehicle and a personalized custom-built pursuit and capture vehicle."
          },
          multiline: true,
          initial_value: values.description || ""
        }
      }
    ]
  })
};

export { ACTIONS, MESSAGES, MODALS };
