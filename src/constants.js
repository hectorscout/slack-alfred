const ACTIONS = {
  openNewProjectDialog: 'OPEN_NEW_PROJECT_DIALOG',
  createNewProject: 'CREATE_NEW_PROJECT',
}

const MESSAGES = {
  newProject: {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Mr. Wayne, are you sure Gotham can _handle_ another project now?"
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "action_id": ACTIONS.openNewProjectDialog,
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "It's the project Gotham needs"
            },
            "style": "primary",
            "value": "new_project"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Right as always Alfred"
            },
            "style": "danger",
            "value": "noop"
          }
        ]
      }
    ]
  }
}

const MODALS = {
  newProject: {
    type: "modal",
    // callback_id: ACTIONS.createNewProject,
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
        element: {
          type: "plain_text_input",
          action_id: "name",
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
        label: {
          type: "plain_text",
          text: "And how would you describe this new project?",
          emoji: true
        },
        element: {
          type: "plain_text_input",
          placeholder: {
            type: "plain_text",
            text: "The best product ever created for understanding and managing your Batcave."
          },
          multiline: true
        },
        optional: true
      },
    ]
  },
  newProjectDialog: {
    // callback_id: ACTIONS.createNewProject,
    callback_id: 'tacos',
    title: "Alfred",
    submit_label: "Really?",
    notify_on_cancel: false,
    elements: [
      {
        'type': "text",
        label: "What project are we creating today then?",
        name: 'name',
      },
      {
        'type': "text",
        label: "And how would you describe this new project?",
        name: 'description',
      }
    ]
  },
  testDialog:   {
    "callback_id": ACTIONS.createNewProject,
    "title": "Alfred",
    "submit_label": "GoAhead",
    "notify_on_cancel": true,
    "state": "Limo",
    "elements": [
      {
        "type": "text",
        "label": "Pickup Location",
        "name": "loc_origin"
      },
      {
        "type": "text",
        "label": "Dropoff Location",
        "name": "loc_destination"
      }
    ]
  }
}

// const DEFAULT_PROJECT

export {
  ACTIONS,
  MESSAGES,
  MODALS
}
