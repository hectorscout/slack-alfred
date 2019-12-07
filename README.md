# Getting Started with local development

## Postgres

Install and start PostgreSQL

- `brew install postgresql`
- `brew services start postgresql` (runs as a service)

Login to postgres

- `psql postgres`

Create a user and password and give them create database access

- `CREATE ROLE api_user WITH LOGIN PASSWORD 'password';`
- `ALTER ROLE api_user CREATEDB;`

Log out of the root user and log in to the newly created user.

- `\q`
- `psql -d postgres -U api_user`

Create a `slack_cache` database and connect to it

- `CREATE DATABASE slack_alfred;`
- `\c slack_alfred`

Create a `projects` table

```postgres
CREATE TABLE projects (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL
);
```

and the other tables in https://github.com/hectorscout/slack-alfred...

## Environment Variables

Create a `.env` file with the following:

```
DB_USER=api_user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=slack_alfred
SLACK_SIGNING_SECRET=<GET THIS FROM SLACK>
SLACK_BOT_ACCESS_TOKEN=<GET THIS FROM SLACK>
```

## Running

Run the server
`npm start`

setup ngrok
`./ngrok http 8080` from wherever ngrok is...

If ngrok url is `https://24392a0c.ngrok.io`:

- Put `https://24392a0c.ngrok.io/slack/events` into the slash command's `Request URL` (you'll have to edit the command).
- Put `https://24392a0c.ngrok.io/slack/events` into the `Request URL` under `Interactive Components`.

## Slack App

Creating a Slack app (probably want to do this in a testing workspace)

- Go to api.slack.com/apps and click `Create New App` (probably have to be signed in and stuff)
- Slash Commands
  - Create a slash command
  - Command: is whatever you want the command to be... (`/alfred`)
  - Request URL: `https://24392a0c.ngrok.io/slack/events` when doing dev work (See ngrok stuff above).
  - Short Description: `Ask Alfred about a project` or something
  - Usage Hint: `[project name]` I guess...
- Interactive Components
  - Turn them on
  - Request URL: `https://24392a0c.ngrok.io/slack/events` (similar ngrok thing)
- Slack Bot
  - Create a slack bot. This is mostly used for its bot token.
- Install the app to your workspace in the Basic Information section

# Heroku (for production)

## Setup

Install the heroku cli, if you haven't

- `brew install heroku/brew/heroku`

Login

- `heroku login`

Create a heroku app

- `heroku create slack-alfred-something-unique`

### Heroku Postgres

In the Heroku web interface add Heroku Postgres to the app.

To check if it's there

- `heroku addons`

This should ouput something like `postgresql-something-00000` as your PostgreSQL instance.

You can login to this instance with

- `heroku pg:psql postgresql-something-00000 --app slack-alfred-something-unique`

To initialize the tables from the project root

- `cat init.ql | heroku pg:psql postgresql-something-00000 --app slack-alfred-something-unique`

Theoretically you can test it locally with
`heroku local web`
It'll probably take a bit of work to get that to actually work though...

### Environment Variables

In the Heroku web interface, go to the settings tab for your app.

There should already be a `DATABASE_URL` Config Var populated. The app will use this instead of the `DB_*` stuff we had in
the `.env` for development.

Add `SLACK_BOT_ACCESS_TOKEN` and `SLACK_SIGNING_SECRET` with the appropriate values from your slack app.

# Deploying to Heroku

- `heroku login`

login to the app...?

- `git push heroku master`

This will push, build, and deploy your app.

It should get deployed to something like `https://slack-alfred-something-unique.herokuapp.com`.

You can find this at the end of the build log (there's probably someplace better to find it, but idk)

Set this URL in your slack app.

# Setting an Audit Channel

You can set a slack channel where Alfred will log all changes made to all projects.

You'll probably want this to be a small private channel. The point is to make sure nobody puts anything in the Bat Computer they shouldn't (username and passwords, AWS keys, that sort of thing).

To do this create/go to the channel you'd like to use as the audi channel and type:

- `/alfred auditchannel`

You'll also need to add the Alfred bot to the private channel so he has permission to post there.

- `/invite @alfred`

If you want to change the audit channel, you'll first need to release the current audit channel by running

- `/alfred releaseaudit`
  in the current audit channel. This is to ensure that no one can change the audit channel besides the few invited to the audit channel.

_*WARNING:* If you delete the audit channel without first releasing it, you won't be able to set a new audit channel unless you go into the DB and clear out the setting. Probably just release it first._
