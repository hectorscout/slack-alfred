const auditPost = (userId, projectName, newStuff) => {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Project:* ${projectName}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*By:* <@${userId}>\n`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Updated Content:* ${newStuff}`,
      },
    },
    {
      type: 'divider',
    },
  ]

  return blocks
}

export default auditPost
