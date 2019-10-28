import * as R from "ramda";
import { ACTIONS } from "./constants";

export const buildProjectBlocks = (project, editable) => {
  const descriptionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${project.name}*\n${project.description}`
    }
  };

  if (editable) {
    const hasSections = project.sections.length > 0;
    descriptionBlock.accessory = {
      type: "static_select",
      action_id: ACTIONS.modProject,
      options: [
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: "Edit Project Name/Description"
          },
          value: `edit_${project.name}_${project.id}`
        },
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: "Add A New Section"
          },
          value: `newsection_${project.name}_${project.id}`
        },
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: hasSections
              ? "Remove sections to remove project"
              : ":no_entry_sign: Delete Project"
          },
          value: hasSections ? "noop" : `delete_${project.name}_${project.id}`
        }
      ],
      placeholder: {
        type: "plain_text",
        emoji: true,
        text: "Modify Project"
      }
    };
  }

  let projectBlocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Here's what we know about *${project.name}*, Master Bruce.`
      }
    },
    {
      type: "divider"
    },
    descriptionBlock,
    {
      type: "divider"
    },
    ...buildSectionBlocks(project.sections, project.name, editable),
    {
      type: "divider"
    }
  ];

  if (editable) {
    projectBlocks.push(
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: ACTIONS.viewProject,
            text: {
              type: "plain_text",
              emoji: true,
              text: "It's Done"
            },
            style: "primary",
            value: `${project.name}`
          }
        ]
      }
    )
  }
  else {
    projectBlocks.push(
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: ACTIONS.editProject,
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
    );
  }
  return projectBlocks;
};

const buildSectionBlocks = (sections, projectName, editable) => {
  const blocks = R.pipe(
    R.map(section => {
      const hasItems = section.items.length > 0;
      const sectionBlock = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${section.name}*`
        }
      };
      if (editable) {
        sectionBlock.accessory = {
          type: "static_select",
          action_id: "mod_section",
          options: [
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: ":pencil: Edit Section Name"
              },
              value: `edit_${projectName}_${section.id}`
            }
          ],
          placeholder: {
            type: "plain_text",
            emoji: true,
            text: "Modify Section"
          }
        };

        if (section.rank !== 0) {
          sectionBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: ":arrow_up_small: Move Section Up"
            },
            value: `up_${projectName}_${section.id}`
          });
        }
        if (section.rank !== sections.length - 1) {
          sectionBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: ":arrow_down_small: Move Section Down"
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
            text: hasItems
              ? "Delete items to delete section"
              : ":no_entry_sign: Delete Section"
          },
          value: hasItems ? "noop" : `delete_${projectName}_${section.id}`
        });
      }
      return [
        sectionBlock,
        {
          type: "divider"
        },
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
  return R.map(item => {
    const itemBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${item.url}|${item.name} - ${item.url}>*\n${item.description}`
      }
    };

    if (editable) {
      itemBlock.accessory = {
        type: "static_select",
        action_id: "mod_item",
        options: [
          {
            text: {
              type: "plain_text",
              emoji: true,
              text: "Edit"
            },
            value: `edit_${projectName}_${item.id}`
          }
        ],
        placeholder: {
          type: "plain_text",
          emoji: true,
          text: "Modify Item"
        }
      };
      if (item.rank !== 0) {
        itemBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: "Move Item Up"
          },
          value: `up_${projectName}_${item.id}`
        });
      }
      if (item.rank !== items.length - 1) {
        itemBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: "Move Item Down"
          },
          value: `down_${projectName}_${item.id}`
        });
      }
      itemBlock.accessory.options.push({
        text: {
          type: "plain_text",
          emoji: true,
          text: "Delete"
        },
        value: `delete_${projectName}_${item.id}`
      });
    }

    return itemBlock;
  })(items);
};
