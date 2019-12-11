import * as R from "ramda";
import { ACTIONS, COMMANDS, ICONS, ITEM_TYPES } from "../constants";

const buildLinkItemBlocks = item => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*<${item.url}|${item.name}>*\n>${item.description.replace(
        "\n",
        "\n>"
      )}`
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
  const name = item.name ? `*${item.name}:* ` : "";
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${name}<#${item.url}>\n>${item.description.replace("\n", "\n>")}`
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
      default:
      // idk
    }

    if (editable) {
      const baseValue = {
        pn: projectName,
        iId: item.id
      };
      itemBlock.accessory = {
        type: "static_select",
        action_id: ACTIONS.modItem,
        options: [
          {
            text: {
              type: "plain_text",
              emoji: true,
              text: `${ICONS.edit} Edit`
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
          text: "Modify Item"
        }
      };
      if (item.rank !== 0) {
        itemBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: `${ICONS.moveUp} Move Item Up`
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.up
          })
        });
      }
      if (item.rank !== items.length - 1) {
        itemBlock.accessory.options.push({
          text: {
            type: "plain_text",
            emoji: true,
            text: `${ICONS.moveDown} Move Item Down`
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.down
          })
        });
      }
      itemBlock.accessory.options.push({
        text: {
          type: "plain_text",
          emoji: true,
          text: `${ICONS.delete} Delete`
        },
        value: JSON.stringify({
          ...baseValue,
          cmd: COMMANDS.delete
        })
      });
    }

    return itemBlock;
  })(items);
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
          action_id: ACTIONS.modSection,
          options: [
            {
              text: {
                type: "plain_text",
                emoji: true,
                text: `${ICONS.edit} Edit Section Name`
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
              text: `${ICONS.moveUp} Move Section Up`
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
              text: `${ICONS.moveDown} Move Section Down`
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
            text: `${ICONS.addNewLink} Add A New Link`
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
            text: `${ICONS.addNewUser} Add A New Slack User`
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
            text: `${ICONS.addNewChannel} Add A New Slack Channel`
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
              ? "Delete all items to delete section"
              : `${ICONS.delete} Delete Section`
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

const buildProjectBlocks = (project, editable, isDump = false) => {
  const descriptionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${project.name}*\n${project.description}`
    }
  };

  if (editable) {
    const baseValue = {
      pn: project.name,
      pId: project.id
    };
    const hasSections = project.sections.length > 0;
    descriptionBlock.accessory = {
      type: "static_select",
      action_id: ACTIONS.modProject,
      options: [
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: `${ICONS.edit} Edit Project Name/Description`
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.edit
          })
        },
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: `${ICONS.addNewSection} Add A New Section`
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: COMMANDS.new
          })
        },
        {
          text: {
            type: "plain_text",
            emoji: true,
            text: hasSections
              ? "Remove all sections to remove project"
              : `${ICONS.delete} Delete Project`
          },
          value: JSON.stringify({
            ...baseValue,
            cmd: hasSections ? COMMANDS.noop : COMMANDS.delete
          })
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

  if (isDump) {
    projectBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Aliases*: ${project.aliases.join(", ")}`
      }
    });
    projectBlocks.push({
      type: "divider"
    });
    projectBlocks.push({
      type: "divider"
    });
  } else {
    let actionId = ACTIONS.editProject;
    let text = `${ICONS.updateButton} Update This`;
    let style;
    if (editable) {
      actionId = ACTIONS.viewProject;
      text = "It's Done";
      style = "primary";
    }
    projectBlocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: actionId,
          text: {
            type: "plain_text",
            emoji: true,
            text
          },
          style,
          value: `${project.name}`
        }
      ]
    });
  }
  return projectBlocks;
};

export default buildProjectBlocks;
