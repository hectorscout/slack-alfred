import { dumpProjects, removeAuditChannel, setAuditChannel } from './auditing'
import { getProjectBlocks, newProjectView } from './projects'
import { getStatsBlocks } from './stats'
import postBlocks from './utils'
import { SLASH_COMMANDS, STATS_RANGES } from './constants'
import { addLookup } from './models'

const handleSlashCommand = app => async ({
  command,
  ack,
  respond,
  context,
  body,
}) => {
  ack()
  const method = command.text.split(' ')[0].toUpperCase()

  switch (method) {
    case SLASH_COMMANDS.NEW:
      newProjectView(app, context.botToken, command.trigger_id)
      break
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
      await dumpProjects(respond, context.botToken, body.channel_id)
      break
    case SLASH_COMMANDS.AUDITCHANNEL:
      await setAuditChannel(
        respond,
        context.botToken,
        body.channel_id,
        body.channel_name
      )
      break
    case SLASH_COMMANDS.RELEASEAUDIT:
      await removeAuditChannel(respond, context.botToken, body.channel_id)
      break
    case SLASH_COMMANDS.STATS:
      postBlocks({
        app,
        blocks: await getStatsBlocks(STATS_RANGES.TODAY),
        respond,
        token: context.botToken,
        userId: body.user_id,
      })
      break
    default:
      addLookup({
        projectName: command.text.toLowerCase(),
        userId: body.user_id,
        requestType: 'SLASH_COMMAND',
      })
      postBlocks({
        app,
        blocks: await getProjectBlocks(command.text, false),
        respond,
        token: context.botToken,
        userId: body.user_id,
      })
  }
}

export default handleSlashCommand
