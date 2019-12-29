import { dumpProjects, removeAuditChannel, setAuditChannel } from "./auditing";
import { lookupProject, newProjectView } from "./projects";

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
    case "NEW":
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
    case "AUDITDUMP":
      await dumpProjects(respond, context.botToken);
      break;
    case "AUDITCHANNEL":
      await setAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      );
      break;
    case "RELEASEAUDIT":
      await removeAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      );
      break;
    default:
      await lookupProject(command.text, false, respond, context.botToken);
  }
};

export default handleSlashCommand;
