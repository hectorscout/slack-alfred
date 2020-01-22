import { dumpProjects, removeAuditChannel, setAuditChannel } from "./auditing";
import { getProjectBlocks, newProjectView } from "./projects";
import postBlocks from "./utils";
import { SLASH_COMMANDS } from "./constants";

const handleSlashCommand = app => async ({
  command,
  ack,
  respond,
  context,
  body
}) => {
  ack();
  const method = command.text.split(" ")[0].toUpperCase();

  switch (method) {
    case SLASH_COMMANDS.NEW:
      newProjectView(app, context.botToken, command.trigger_id);
      break;
    // case "HELP":
    //   getProjects(projects => {
    //     respond({
    //       text: `The following projects are available: \`${R.join(
    //         "`, `",
    //         R.pluck("name", projects)
    //       )}\``
    //     });
    //   });
    //   break;
    case SLASH_COMMANDS.AUDITDUMP:
      await dumpProjects(respond, context.botToken, body.channel_id);
      break;
    case SLASH_COMMANDS.AUDITCHANNEL:
      await setAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      );
      break;
    case SLASH_COMMANDS.RELEASEAUDIT:
      await removeAuditChannel(respond, context.botToken, body.channel_id);
      break;
    default:
      postBlocks({
        app,
        blocks: await getProjectBlocks(command.text, false),
        respond,
        token: context.botToken,
        userId: body.user_id
      });
  }
};

export default handleSlashCommand;
