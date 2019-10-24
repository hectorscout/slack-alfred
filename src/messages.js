import * as R from "ramda";

export const buildProjectBlocks = project => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `The \`${project.name}\` project resources, sir.`
      }
    },
    {
      type: "divider"
    },
    ...buildSectionBlocks(project.sections)
  ];
};

const buildSectionBlocks = sections => {
  return R.flatten(
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
    })(sections)
  );
};
