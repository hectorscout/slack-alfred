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
      type: "overflow",
      action_id: 'mod_project',
      options: [
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: "Edit Project Name/Description",
          },
          value: `edit_${project.name}_${project.id}`
        },
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: "Add A New Section",
          },
          value: `newsection_${project.name}_${project.id}`
        }
      ]
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
    ...buildSectionBlocks(project.sections, project.name, editable)
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

const buildSectionBlocks = (sections, projectName, editable) => {
  const blocks = R.pipe(
    // R.values,
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
                text: ":pencil: Edit Section Name",
              },
              value: `edit_${projectName}_${section.id}`
            }
          ]
        };

        if (section.rank !== 0) {
          sectionBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: ":arrow_up_small: Move Section Up",
            },
            value: `up_${projectName}_${section.id}`
          });
        }
        if (section.rank !== sections.length - 1) {
          sectionBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: ":arrow_down_small: Move Section Down",
            },
            value: `down_${projectName}_${section.id}`
          });
        }
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: ":heavy_plus_sign: Add A New Item"
          },
          value: `newitem_${projectName}_${section.id}`
        });
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: ":no_entry_sign: Delete Whole Section",
          },
          value: `delete_${projectName}_${section.id}`
        });
      }
      return [
        {
          type: "divider"
        },
        sectionBlock,
        ...buildItemBlocks(section.items, projectName, editable)
      ];
    }),
    R.flatten
  )(sections);
  return blocks;
};

const buildItemBlocks = (items, projectName, editable) => {
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
              value: `edit_${projectName}_${item.id}`
            }
          ]
        };
        if (item.rank !== 0) {
          itemBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: "Move Item Up",
            },
            value: `up_${projectName}_${item.id}`
          })
        }
        if (item.rank !== items.length - 1) {
          itemBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: "Move Item Down",
            },
            value: `down_${projectName}_${item.id}`
          });
        }
        itemBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: "Delete",
          },
          value: `delete_${projectName}_${item.id}`
        });
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
