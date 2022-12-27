# Integrations SlackBot 

This is a repo cloned from the DX team, thank you DX team!

Integrations is using this to create a slack bot for project updates.

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

## Managing the Slack App

The Slack app is located at https://api.slack.com/apps/A030QG4QGG5.

Managing the commands themselves happens in the "Slash Commands" section.

The modal configuration and process nudge shortcut management happens in "Interactivity & Shortcuts".

### Local dev tips

- Use `ntl dev --live` and use the live URL as the slash command / interactivity Request URL for local testing
- Slack commands have to be finished within 3 or 4 seconds, so using background functions will avoid flakiness
