import { ACTIONS } from "../constants";

const sectionModal = values => {
  return {
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
  };
};

export default sectionModal;
