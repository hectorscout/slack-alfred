import { ACTIONS, MAX_TEXT_INPUT_LENGTH } from '../constants'

const projectModal = values => {
  return {
    type: 'modal',
    callback_id: ACTIONS.saveProject,
    private_metadata: values.id ? `${values.id}` : '',
    title: {
      type: 'plain_text',
      text: 'Project',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Go Ahead',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel That',
      emoji: true,
    },
    blocks: [
      {
        type: 'input',
        block_id: 'project_name',
        element: {
          type: 'plain_text_input',
          action_id: 'project_name',
          placeholder: {
            type: 'plain_text',
            text: 'BatIQ',
          },
          initial_value: values.name || '',
          max_length: MAX_TEXT_INPUT_LENGTH,
        },
        label: {
          type: 'plain_text',
          text: 'What should the project be called then?',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text:
              'If the project has an `:emoji:` feel free to include it here.',
          },
        ],
      },
      {
        type: 'input',
        block_id: 'project_description',
        label: {
          type: 'plain_text',
          text: 'And how would you describe the project, sir?',
          emoji: true,
        },
        element: {
          type: 'plain_text_input',
          action_id: 'project_description',
          placeholder: {
            type: 'plain_text',
            text:
              'The best product ever created for understanding and managing your Batcave and the darkness within.',
          },
          multiline: true,
          initial_value: values.description || '',
          max_length: MAX_TEXT_INPUT_LENGTH,
        },
      },
      {
        type: 'input',
        block_id: 'project_aliases',
        optional: true,
        label: {
          type: 'plain_text',
          text:
            'What names should bring up this project (comma separated, not case sensitive)?',
          emoji: true,
        },
        element: {
          type: 'plain_text_input',
          action_id: 'project_aliases',
          placeholder: {
            type: 'plain_text',
            text: 'bat, cave, batcave, biq',
          },
          multiline: true,
          initial_value: values.aliases || '',
          max_length: MAX_TEXT_INPUT_LENGTH,
        },
      },
    ],
  }
}

export default projectModal
