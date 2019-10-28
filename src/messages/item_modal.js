import { ACTIONS, ITEM_TYPES } from "../constants";

const getUrlBlocks = values => {
  return [
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
  ];
};

const getUserBlocks = values => {
  return [
    {
      type: "input",
      block_id: "item_user",
      element: {
        type: "users_select",
        action_id: "item_user",
        placeholder: {
          type: "plain_text",
          text: "The Penguin"
        }
        // initial_user: values.url || ""
      },
      label: {
        type: "plain_text",
        text: "Who are we calling out?"
      }
    },
    {
      type: "input",
      block_id: "item_name",
      element: {
        type: "plain_text_input",
        action_id: "item_name",
        placeholder: {
          type: "plain_text",
          text: "The Gentleman of Crime"
        },
        initial_value: values.name || ""
      },
      label: {
        type: "plain_text",
        text: "What is this person's role?"
      }
    },
    {
      type: "input",
      block_id: "item_description",
      label: {
        type: "plain_text",
        text: "And anything else, like what you might search them out for?",
        emoji: true
      },
      element: {
        type: "plain_text_input",
        action_id: "item_description",
        placeholder: {
          type: "plain_text",
          text: "Go to him for advise about hiding weapons in umbrellas."
        },
        multiline: true,
        initial_value: values.description || ""
      }
    }
  ];
};

const getChannelBlocks = values => {
  return [];
};

const itemModal = values => {
  const modal = {
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
    blocks: []
  };

  switch (values.type) {
    case ITEM_TYPES.url:
      modal.blocks = getUrlBlocks(values);
      break;
    case ITEM_TYPES.user:
      modal.blocks = getUserBlocks(values);
      break;
    case ITEM_TYPES.channel:
      modal.blocks = getChannelBlocks(values);
      break;
  }

  return modal;
  // {
  //   type: "section",
  //   text: {
  //     type: "mrkdwn",
  //     text: "What type of item is this?"
  //   },
  //   accessory: {
  //     type: "static_select",
  //     action_id: ACTIONS.itemTypeSelection,
  //     placeholder: {
  //       type: "plain_text",
  //       emoji: true,
  //       text: "Select a type"
  //     },
  //     options: [
  //       {
  //         text: {
  //           type: "plain_text",
  //           emoji: true,
  //           text: "A Link"
  //         },
  //         value: "URL"
  //       },
  //       {
  //         text: {
  //           type: "plain_text",
  //           emoji: true,
  //           text: "A Slack User"
  //         },
  //         value: "USER"
  //       },
  //       {
  //         text: {
  //           type: "plain_text",
  //           emoji: true,
  //           text: "A Slack Channel"
  //         },
  //         value: "CHANNEL"
  //       }
  //     ]
  //   }
  // },
};

export default itemModal;
