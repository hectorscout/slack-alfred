import * as R from "ramda";
import { BLOCKS } from "../constants";

const projectsStats = projects => {
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

  return blocks;
};

export default projectsStats;
