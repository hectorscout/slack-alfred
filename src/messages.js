import * as R from "ramda";
import { ACTIONS, COMMANDS, ITEM_TYPES } from "./constants";

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

  const projectBlocks = [
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
    projectBlocks.push({
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
    });
  } else {
    projectBlocks.push({
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
    });
  }
  return projectBlocks;
};

const buildSectionBlocks = (sections, projectName, editable) => {
  const blocks = R.pipe(
    R.map(section => {
      // value can only be 75 char, so we're gonna use stupid short keys
      const baseValue = {
        pn: projectName,
        sId: section.id
      };
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
              value: JSON.stringify({
                ...baseValue,
                cmd: COMMANDS.edit
              })
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
            value: JSON.stringify({
              ...baseValue,
              cmd: COMMANDS.up
            })
          });
        }
        if (section.rank !== sections.length - 1) {
          sectionBlock.accessory.options.push({
            text: {
              type: "plain_text",
              emoji: true,
              text: ":arrow_down_small: Move Section Down"
            },
            value: JSON.stringify({
              ...baseValue,
              cmd: COMMANDS.down
            })
          });
        }
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: ":heavy_plus_sign: Add A New Link"
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.new,
            type: "URL"
          })
        });
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: ":heavy_plus_sign: Add A New Slack User"
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.new,
            type: "USER"
          })
        });
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: ":heavy_plus_sign: Add A New Slack Channel"
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.new,
            type: "CHANNEL"
          })
        });
        sectionBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: hasItems
              ? "Delete items to delete section"
              : ":no_entry_sign: Delete Section"
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: hasItems ? COMMANDS.noop : COMMANDS.delete
          })
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

const buildLinkItemBlocks = item => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*<${item.url}|${item.name} - ${
        item.url
      }>*\n>${item.description.replace("\n", "\n>")}`
    }
  };
};

const buildUserItemBlocks = item => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${item.name}:* <@${item.url}>\n>${item.description.replace(
        "\n",
        "\n>"
      )}`
    }
  };
};

const buildChannelItemBlocks = item => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${item.name}:* <#${item.url}>\n>${item.description.replace(
        "\n",
        "\n>"
      )}`
    }
  };
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
    let itemBlock = {};
    switch (item.type) {
      case ITEM_TYPES.url:
        itemBlock = buildLinkItemBlocks(item);
        break;
      case ITEM_TYPES.user:
        itemBlock = buildUserItemBlocks(item);
        break;
      case ITEM_TYPES.channel:
        itemBlock = buildChannelItemBlocks(item);
        break;
    }

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
