require('dotenv').config();

const { ACTIONS, MESSAGES, MODALS } = require('./constants')

const { App } = require('@slack/bolt');

console.log(process.env.SLACK_SIGNING_SECRET);
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_ACCESS_TOKEN,
});


(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`Bolt app is running on port ${port}`);
})();

app.command('/alfred', ({ command, ack, respond, context }) => {
  ack();
  console.log('in new');
  console.log(command)
  // respond({text: command.text})
  const method = command.text.split(' ')[0].toUpperCase()

  switch (method) {
    case 'NEW':
      app.client.views.open({
        token: context.botToken,
        view: MODALS.newProject,
        trigger_id: command.trigger_id
      })
  }
});
