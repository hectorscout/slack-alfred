import * as R from "ramda";

export const buildProjectBlocks = project => {
  return [
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
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${project.description}`
      }
    },
    ...buildSectionBlocks(project.sections, project.id)
  ];
};

const buildSectionBlocks = (sections, productId) => {
  const blocks = R.pipe(
    R.values,
    R.map(section => {
      return [
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${section.name}*`
          }
        },
        ...buildItemBlocks(section.items, productId)
      ];
    }),
    R.flatten
  )(sections);
  // console.log('((((((((((((((((((((((((((((((((((((((((((', blocks);
  return blocks;
};

const buildItemBlocks = (items, projectId) => {
  if (!items.length) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "I didn't find anything for this section. Perhaps you would like to edit the project?"
        }
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
              text: "Edit"
            },
            style: "primary",
            value: `${projectId}`
          }
        ]
      }
    ];
  }
  return R.pipe(
    R.map(item => {
      return [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${item.url}|${item.name}> - ${item.description}`
          }
        }
      ];
    }),
    R.flatten
  )(items);
};
