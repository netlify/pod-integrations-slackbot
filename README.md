# Developer Experience

This is a repo for DX-related things. Right now we use it for a few small utilities.

Most of what this org does happens in
[our Notion docs](https://www.notion.so/netlify/About-DX-Netlify-876ff549e02646b7b4d889e025ec7768).

You can also find us [on Slack in #crew-all-dx](https://netlify.slack.com/archives/CCC1HDWQY).

> **NOTE:** a lot of the code in this repo is copy-pasta from https://github.com/learnwithjason/slack-bot, which is
> released under the ISC license.

## First time setup

Install dependencies in the project root:

```
npm i
```

Sign in to your _Netlify_ Netlify account. First, log in to that account in your browser, and run the following command
in your terminal.

```
netlify login
```

**Make sure you select the checkbox to "Allow access to my SAML-based Netlify team".**

![Screenshot of the Netlify auth screen showing the SAML checkbox checked](netlify_login_screenshot.png)

To check you're signed in correctly, run the following command:

```
netlify status
```

You should see something like this. Make sure you see "Netlify" under the teams heading!

```
──────────────────────┐
 Current Netlify User │
──────────────────────┘
Name:  Your Name
Email: you@netlify.com
Teams:
  Your team: Collaborator
  Netlify: Owner Collaborator Controller
```

Run the following command in your terminal to link your local repo with the Netlify site:

```
netlify link
```

## Local development

Run the app in development using:

```
netlify dev
```

All environment variables needed will be injected for you.

To call a function, hit an endpoint in your browser, formatted like:

```
http://localhost:8888/api/slack/triage-reminder
```

Test the output of the Appybara in [#test-dx-appybara](https://app.slack.com/client/T02UKDKNA/C04C21ZNFEC) in the
Netlify Slack.

## The DX Newsletter

### Updating Notion

After a Newsletter has been sent, it's useful to create a new Newsletter issue in Notion [here](https://www.notion.so/netlify/cdd79d3f92d146b7bfa12a170feb9ca7?v=b6c1e67cd84d4df4af7e8b7d8b12ba25) and update the following in `newsletter-reminder` to the latest Newsletter issue view. This will ensure the reminder is accurate when it is sent.

```javascript
const msgLink =
  'https://www.notion.so/netlify/cdd79d3f92d146b7bfa12a170feb9ca7?v=b6c1e67cd84d4df4af7e8b7d8b12ba25';
```

### How to send the DX Newsletter

The function requires a `POST`, so you can either send via cURL in the command line (see snippet) or set up Postman or something.

```shell
curl --location --request POST 'https://developer-experience.netlify.app/.netlify/functions/newsletter-sender' \
--header 'Content-Type: application/json' \
--data-raw '{
    "issue": "09",
    "to": "jason.lengstorf@netlify.com",
    "lede": "Hey there capybuddies! \n\nThis is the text that shows up before the newsletter items."
}'
```

Send the options as JSON.

The available options are:

Option | Required? | Description
------ | --------- | -----------
issue  | yes       | Which newsletter issue to send. This is how the [DX Newsletter is filtered](https://www.notion.so/netlify/cdd79d3f92d146b7bfa12a170feb9ca7?v=33433890fa6c43fabbf2273677f688c8).
channel | no       | A Slack channel ID. Defaults to the `SLACK_CHANNEL_ID` value.
subject | no       | A subject line for the email that gets sent.
lede    | no       | A block of text that shows up at the top of the Slack message and email.
to      | no       | Which email to send to. MUST be a personal email and not a group (see note below).

### Notes about sending email

Netlify groups will ignore messages from this service, so the recipient _must_ be a personal email.

The flow I’ve used in the past is:

1. Send the email to my own Netlify email
2. Select the forward option after you receive the email
3. Set the recipient to `internal-team@netlify.com`
4. Update the subject line to remove the "Fw" part
5. Delete all the meta details so it's just the original message

This is a bit of a pain, but it doesn't take too long and works fine.

## Managing the Slack App

The Slack app is located at https://api.slack.com/apps/A030QG4QGG5.

Managing the commands themselves happens in the "Slash Commands" section.

The modal configuration and process nudge shortcut management happens in "Interactivity & Shortcuts".

### Local dev tips

- Use `ntl dev --live` and use the live URL as the slash command / interactivity Request URL for local testing
- Slack commands have to be finished within 3 or 4 seconds, so using background functions will avoid flakiness
