import { ACTIONS, MAX_TEXT_INPUT_LENGTH } from '../constants'

const sectionModal = values => {
  return {
    type: 'modal',
    callback_id: ACTIONS.saveSection,
    private_metadata: JSON.stringify(values),
    title: {
      type: 'plain_text',
      text: 'Section',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'The Section Is Ready',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Not Today',
      emoji: true,
    },
    blocks: [
      {
        type: 'input',
        block_id: 'section_name',
        element: {
          type: 'plain_text_input',
          action_id: 'section_name',
          placeholder: {
            type: 'plain_text',
            text: 'Bat Vehicles',
          },
          initial_value: values.name || '',
          max_length: MAX_TEXT_INPUT_LENGTH,
        },
        label: {
          type: 'plain_text',
          text: 'What section is this?',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text:
              'Including an `:emoji:` at the beginning of the section name can help visually separate the sections.',
          },
        ],
      },
    ],
  }
}

export default sectionModal
