import * as R from "ramda";

export const buildProjectBlocks = (project, editable) => {

  const descriptionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${project.description}`
    },
  };

  if (editable) {
    descriptionBlock.accessory = {
      type: "button",
      action_id: 'edit_project',
      text: {
        type: "plain_text",
        emoji: true,
        text: "edit",
      },
      value: `${project.id}`
    }
  }

  let projectBlocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Here's what I know about \`${project.name}\`, Master Bruce.`
      }
    },
    {
      type: "divider"
    },
    descriptionBlock,
    ...buildSectionBlocks(project.sections, editable)
  ];

  if (!editable) {
    projectBlocks = projectBlocks.concat([
      {
        type: 'divider'
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "edit_mode",
            text: {
              type: "plain_text",
              emoji: true,
              text: "I need to edit this"
            },
            style: "primary",
            value: `${project.name}`
          }
        ]
      }
    ]);
  }
  return projectBlocks;
};

const buildSectionBlocks = (sections, editable) => {
  const blocks = R.pipe(
    R.values,
    R.map(section => {
      const sectionBlock =
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${section.name}*`
        }
      };
      if (editable) {
        sectionBlock.accessory = {
          type: "overflow",
          action_id: 'mod_section',
          options: [
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: "Edit Section Name",
              },
              value: `edit_${section.id}`
            },
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: "Delete Whole Section",
              },
              value: `delete_${section.id}`
            }
          ]
        }
      }
      return [
        {
          type: "divider"
        },
        sectionBlock,
        ...buildItemBlocks(section.items, editable)
      ];
    }),
    R.flatten
  )(sections);
  // console.log('((((((((((((((((((((((((((((((((((((((((((', blocks);
  return blocks;
};

const buildItemBlocks = (items, editable) => {
  if (!items.length) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "I didn't find anything for this section. Perhaps you would like to edit the project?"
        }
      }
    ];
  }
  return R.pipe(
    R.map(item => {
      const itemBlock = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${item.url}|${item.name} - ${item.url}>`
        }
      };

      if (editable) {
        itemBlock.accessory = {
          type: "overflow",
          action_id: 'mod_item',
          options: [
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: "Edit",
              },
              value: `edit_${item.id}`
            },
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: "Delete",
              },
              value: `delete_${item.id}`
            }
          ]
        }
      }

      return [
        itemBlock,
        {
          type: "context",
          elements: [
            {
              type: 'mrkdwn',
              text: item.description
            }
          ]
        }
      ];
    }),
    R.flatten
  )(items);
};
