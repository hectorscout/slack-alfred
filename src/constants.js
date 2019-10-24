const ACTIONS = {
  openNewProjectDialog: "OPEN_NEW_PROJECT_DIALOG",
  createNewProject: "CREATE_NEW_PROJECT"
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
  newProject: {
    type: "modal",
    callback_id: ACTIONS.createNewProject,
    title: {
      type: "plain_text",
      text: "Alfred",
      emoji: true
    },
    submit: {
      // "action_id": ACTIONS.createNewProject,
      type: "plain_text",
      text: "Go Ahead",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Nevermind",
      emoji: true
    },
    blocks: [
      {
        type: "input",
        block_id: "project_name",
        element: {
          type: "plain_text_input",
          action_id: "project_name",
          placeholder: {
            type: "plain_text",
            text: "BatIQ"
          }
        },
        label: {
          type: "plain_text",
          text: "What project are we creating today then?"
        }
      },
      {
        type: "input",
        block_id: "project_description",
        label: {
          type: "plain_text",
          text: "And how would you describe this new project?",
          emoji: true
        },
        element: {
          type: "plain_text_input",
          action_id: "project_description",
          placeholder: {
            type: "plain_text",
            text:
              "The best product ever created for understanding and managing your Batcave."
          },
          multiline: true
        },
        optional: true
      }
    ]
  }
};

// const DEFAULT_PROJECT

export { ACTIONS, MESSAGES, MODALS };