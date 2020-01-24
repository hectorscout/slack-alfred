import * as R from "ramda";
import { ACTIONS, BLOCKS, STATS_RANGES } from "../constants";

const RANGE_OPTION_BLOCKS = {
  [STATS_RANGES.TODAY]: BLOCKS.option("Today", STATS_RANGES.TODAY),
  [STATS_RANGES.WEEK]: BLOCKS.option("Last 7 Days", STATS_RANGES.WEEK),
  [STATS_RANGES.THIRTY]: BLOCKS.option("Last 30 Days", STATS_RANGES.THIRTY),
  [STATS_RANGES.SIXTY]: BLOCKS.option("Last 60 Days", STATS_RANGES.SIXTY),
  [STATS_RANGES.NINETY]: BLOCKS.option("Last 90 Days", STATS_RANGES.NINETY),
  [STATS_RANGES.YEAR]: BLOCKS.option("Last 365 Days", STATS_RANGES.YEAR),
  [STATS_RANGES.ALLTIME]: BLOCKS.option("All Time", STATS_RANGES.ALLTIME)
};

const projectsStats = (projects, range) => {
  const blocks = [
    BLOCKS.text("Here's how the Bat Family has been using the Bat Computer"),
    BLOCKS.divider()
  ];

  R.forEach(({ project_name, lookup_count, lookup_user_count }) => {
    blocks.push(
      BLOCKS.text(
        `*${project_name}*
        Looked up ${lookup_count} time${
          lookup_count === "1" ? "" : "s"
        } by ${lookup_user_count} ${
          lookup_user_count === "1" ? "person" : "people"
        }.`
      )
    );
    blocks.push(BLOCKS.divider());
  }, projects);

  blocks.push(
    BLOCKS.select(
      ACTIONS.setStatsRange,
      "How far would you like to go back sir?",
      "Select a range",
      [
        RANGE_OPTION_BLOCKS[STATS_RANGES.TODAY],
        RANGE_OPTION_BLOCKS[STATS_RANGES.WEEK],
        RANGE_OPTION_BLOCKS[STATS_RANGES.THIRTY],
        RANGE_OPTION_BLOCKS[STATS_RANGES.SIXTY],
        RANGE_OPTION_BLOCKS[STATS_RANGES.NINETY],
        RANGE_OPTION_BLOCKS[STATS_RANGES.YEAR],
        RANGE_OPTION_BLOCKS[STATS_RANGES.ALLTIME]
      ],
      RANGE_OPTION_BLOCKS[range]
    )
  );

  return blocks;
};

export default projectsStats;
