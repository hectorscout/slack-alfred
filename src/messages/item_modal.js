import { ACTIONS, ITEM_TYPES, MAX_TEXT_INPUT_LENGTH } from "../constants";

const TITLES = {
  [ITEM_TYPES.url]: "Link",
  [ITEM_TYPES.user]: "USER",
  [ITEM_TYPES.channel]: "Channel"
};

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
        initial_value: values.name || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      },
      label: {
        type: "plain_text",
        text: "What would you call this link?"
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
        initial_value: values.url || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      },
      label: {
        type: "plain_text",
        text: "What is the Uniform Resource Locator, or URL, for this link?"
      }
    },
    {
      type: "input",
      block_id: "item_description",
      optional: true,
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
        initial_value: values.description || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      }
    }
  ];
};

const getUserBlocks = values => {
  const userInputElement = {
    type: "users_select",
    action_id: "item_user",
    placeholder: {
      type: "plain_text",
      text: "The Penguin"
    }
  };

  if (values.url) {
    userInputElement.initial_user = values.url;
  }

  return [
    {
      type: "input",
      block_id: "item_user",
      element: userInputElement,
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
        initial_value: values.name || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      },
      label: {
        type: "plain_text",
        text: "What is this person's role?"
      }
    },
    {
      type: "input",
      block_id: "item_description",
      optional: true,
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
        initial_value: values.description || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      }
    }
  ];
};

const getChannelBlocks = values => {
  const channelElement = {
    type: "channels_select",
    action_id: "item_channel",
    placeholder: {
      type: "plain_text",
      text: "same_bat_channel"
    }
  };

  if (values.url) {
    channelElement.initial_channel = values.url;
  }

  return [
    {
      type: "input",
      block_id: "item_channel",
      element: channelElement,
      label: {
        type: "plain_text",
        text: "Which channel?"
      }
    },
    {
      type: "input",
      block_id: "item_name",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: "item_name",
        placeholder: {
          type: "plain_text",
          text: "What's Next!?"
        },
        initial_value: values.name || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      },
      label: {
        type: "plain_text",
        text: "A short name for the channel?"
      }
    },
    {
      type: "input",
      block_id: "item_description",
      optional: true,
      label: {
        type: "plain_text",
        text: "What would one find in this channel?",
        emoji: true
      },
      element: {
        type: "plain_text_input",
        action_id: "item_description",
        placeholder: {
          type: "plain_text",
          text:
            "It appears the Caped Crusader's \"goose is cooked\". Will Robin's wings be clipped?\nNext week, the exciting conclusion.\nSame bat time, same bat channel!"
        },
        multiline: true,
        initial_value: values.description || "",
        max_length: MAX_TEXT_INPUT_LENGTH
      }
    }
  ];
};

const itemModal = values => {
  const modal = {
    type: "modal",
    callback_id: ACTIONS.saveItem,
    private_metadata: JSON.stringify(values),
    title: {
      type: "plain_text",
      text: TITLES[values.type],
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
    default:
    // idk
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
