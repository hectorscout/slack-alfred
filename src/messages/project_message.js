import * as R from "ramda";
import { ACTIONS, COMMANDS, ICONS, ITEM_TYPES, BLOCKS } from "../constants";

const buildLinkItemBlocks = item => {
  return BLOCKS.text(
    `*<${item.url}|${item.name}>*\n>${item.description.replace("\n", "\n>")}`
  );
};

const buildUserItemBlocks = item => {
  return BLOCKS.text(
    `*${item.name}:* <@${item.url}>\n>${item.description.replace("\n", "\n>")}`
  );
};

const buildChannelItemBlocks = item => {
  const name = item.name ? `*${item.name}:* ` : "";
  return BLOCKS.text(
    `${name}<#${item.url}>\n>${item.description.replace("\n", "\n>")}`
  );
};

const buildItemOptions = (projectName, itemId, itemRank, itemsLength) => {
  const baseValue = {
    pn: projectName,
    iId: itemId
  };
  const options = [
    BLOCKS.option(`${ICONS.edit} Edit`, { ...baseValue, cmd: COMMANDS.edit })
  ];

  if (itemRank !== 0) {
    options.push(
      BLOCKS.option(`${ICONS.moveUp} Move Item Up`, {
        ...baseValue,
        cmd: COMMANDS.up
      })
    );
  }
  if (itemRank !== itemsLength - 1) {
    options.push(
      BLOCKS.option(`${ICONS.moveDown} Move Item Down`, {
        ...baseValue,
        cmd: COMMANDS.down
      })
    );
  }
  options.push(
    BLOCKS.option(`${ICONS.delete} Delete`, {
      ...baseValue,
      cmd: COMMANDS.delete
    })
  );

  return BLOCKS.dropdown(ACTIONS.modItem, options, "Modify Item");
};

const buildItemBlocks = (items, projectName, editable) => {
  if (!items.length) {
    return [
      BLOCKS.text(
        "I didn't find anything for this section. Perhaps you would like to edit the project?"
      )
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
      itemBlock.accessory = buildItemOptions(
        projectName,
        item.id,
        item.rank,
        items.length
      );
    }

    return itemBlock;
  })(items);
};

const buildSectionOptions = (
  projectName,
  sectionId,
  rank,
  sectionsLength,
  hasItems
) => {
  // value can only be 75 char, so we're gonna use stupid short keys
  const baseValue = {
    pn: projectName,
    sId: sectionId
  };

  const options = [
    BLOCKS.option(`${ICONS.edit} Edit Section Name`, {
      ...baseValue,
      cmd: COMMANDS.edit
    })
  ];

  if (rank !== 0) {
    options.push(
      BLOCKS.option(`${ICONS.moveUp} Move Section Up`, {
        ...baseValue,
        cmd: COMMANDS.up
      })
    );
  }
  if (rank !== sectionsLength - 1) {
    options.push(
      BLOCKS.option(`${ICONS.moveDown} Move Section Down`, {
        ...baseValue,
        cmd: COMMANDS.down
      })
    );
  }
  options.push(
    BLOCKS.option(`${ICONS.addNewLink} Add A New Link`, {
      ...baseValue,
      cmd: COMMANDS.new,
      type: "URL"
    })
  );
  options.push(
    BLOCKS.option(`${ICONS.addNewUser} Add A New Slack User`, {
      ...baseValue,
      cmd: COMMANDS.new,
      type: "USER"
    })
  );
  options.push(
    BLOCKS.option(`${ICONS.addNewChannel} Add A New Slack Channel`, {
      ...baseValue,
      cmd: COMMANDS.new,
      type: "CHANNEL"
    })
  );
  options.push(
    BLOCKS.option(
      hasItems
        ? "Delete all items to delete section"
        : `${ICONS.delete} Delete Section`,
      { ...baseValue, cmd: hasItems ? COMMANDS.noop : COMMANDS.delete }
    )
  );

  return BLOCKS.dropdown(ACTIONS.modSection, options, "Modify Section");
};

const buildSectionBlocks = (sections, projectName, editable) => {
  const blocks = R.pipe(
    R.map(section => {
      const sectionBlock = BLOCKS.text(`*${section.name}*`);

      if (editable) {
        const hasItems = section.items.length > 0;
        sectionBlock.accessory = buildSectionOptions(
          projectName,
          section.id,
          section.rank,
          sections.length,
          hasItems
        );
      }

      return [
        sectionBlock,
        BLOCKS.divider(),
        ...buildItemBlocks(section.items, projectName, editable),
        BLOCKS.divider()
      ];
    }),
    R.flatten
  )(sections);
  return blocks;
};

const buildProjectOptions = (projectName, projectId, hasSections) => {
  const baseValue = {
    pn: projectName,
    pId: projectId
  };
  return BLOCKS.dropdown(
    ACTIONS.modProject,
    [
      BLOCKS.option(`${ICONS.edit} Edit Project Name/Description`, {
        ...baseValue,
        cmd: COMMANDS.edit
      }),
      BLOCKS.option(`${ICONS.addNewSection} Add A New Section`, {
        ...baseValue,
        cmd: COMMANDS.new
      }),
      BLOCKS.option(
        hasSections
          ? "Remove all sections to remove project"
          : `${ICONS.delete} Delete Project`,
        { ...baseValue, cmd: hasSections ? COMMANDS.noop : COMMANDS.delete }
      )
    ],
    "Modify Project"
  );
};

const buildProjectButton = (projectName, editable) => {
  let actionId = ACTIONS.editProject;
  let text = `${ICONS.updateButton} Update This`;
  let style;
  if (editable) {
    actionId = ACTIONS.viewProject;
    text = "It's Done";
    style = "primary";
  }
  return {
    type: "actions",
    elements: [BLOCKS.button(actionId, text, style, projectName)]
  };
};

const buildProjectDescriptionBlock = (
  { name, description, id, sections },
  editable
) => {
  const descriptionBlock = BLOCKS.text(`*${name}*\n${description}`);

  if (editable) {
    const hasSections = sections.length > 0;
    descriptionBlock.accessory = buildProjectOptions(name, id, hasSections);
  }
  return descriptionBlock;
};

const buildProjectBlocks = (project, editable, isDump = false) => {
  const projectBlocks = [
    BLOCKS.text(`Here's what we know about *${project.name}*, Master Bruce.`),
    BLOCKS.divider(),
    buildProjectDescriptionBlock(project, editable),
    BLOCKS.divider(),
    ...buildSectionBlocks(project.sections, project.name, editable),
    BLOCKS.divider()
  ];

  if (isDump) {
    projectBlocks.push(BLOCKS.text(`*Aliases*: ${project.aliases.join(", ")}`));
    projectBlocks.push(BLOCKS.divider());
    projectBlocks.push(BLOCKS.divider());
  } else {
    projectBlocks.push(buildProjectButton(project.name, editable));
  }

  return projectBlocks;
};

export default buildProjectBlocks;
