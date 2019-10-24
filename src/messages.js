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
        value: project.id
      }
    }
  }

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
    descriptionBlock,
    ...buildSectionBlocks(project.sections, project.id),
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
          value: `${project.id}`
        }
      ]
    }
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
      // {
      //   type: "actions",
      //   elements: [
      //     {
      //       type: "button",
      //       action_id: "edit_mode",
      //       text: {
      //         type: "plain_text",
      //         emoji: true,
      //         text: "Edit"
      //       },
      //       style: "primary",
      //       value: `${projectId}`
      //     }
      //   ]
      // }
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

export const buildEditableProjectBlocks = project => {


}
