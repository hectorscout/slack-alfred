import * as R from "ramda";

export const buildProjectBlocks = project => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Here's what I know about the \`${project.name}\` project, sir.`
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
    {
      type: "divider"
    },
    ...buildSectionBlocks(project.sections)
  ];
};

const buildSectionBlocks = sections => {
  const sectionBlocks =
    R.pipe(
      R.values,
      R.map(section => {
        return [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${section.name}*`
            }
          },
          {
            type: "divider"
          }
        ];
      }),
      R.flatten
    )(sections);
  return sectionBlocks;
};
