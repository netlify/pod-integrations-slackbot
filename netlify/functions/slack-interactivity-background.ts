/**
 * NOTE: This function hits a few different APIs, so it can take a little while
 * to finish. To avoid Slack thinking it timed out and showing an error, we’ll
 * run this as a background function. It does work when it’s *not* a background
 * function, but every once in a while Slack will send an error message because
 * it took too long to respond. Since we have background functions available,
 * it’s easier to just... not worry about it and let the function run as long
 * as it needs to.
 *
 * @see https://docs.netlify.com/functions/background-functions/
 */

import type { Handler } from '@netlify/functions';
import { parse } from 'querystring';

import {
  getUserByEmail,
  UpdateEntry,
  convertEasyKeysToNotionData,
  notionPageUrl,
} from './utils/notion';
import { blocks, properties, notionApi } from './utils/notion';
import { markdown, slackApi } from './utils/slack';

async function shortcutProcessNudge(payload) {
  const userId = payload.message.user;
  const commands = `
- \`/integrations-update\` — use this to make a project update 
`;

  const channel = payload.channel.id;
  const thread_ts = payload.message.thread_ts ?? payload.message.ts;

  await slackApi('conversations.join', { channel });

  await slackApi('chat.postMessage', {
    channel,
    thread_ts,
    blocks: [
      markdown(`Hey <@${userId}>!`),
      markdown(
        `To make sure we don’t lose track of things, we ask that everyone submits updates using our slash command:`,
      ),
      markdown(commands),
      markdown(
        `Type the above into any Slack channel (not a thread!), follow the prompts, and your update will be added to <${notionPageUrl}.`,
      ),
      markdown(`Thanks for helping us stay organized!`),
    ],
  });

  return {
    statusCode: 200,
    body: '',
  };
}

async function createUpdate(payload, callbackId) {
  const values = payload.view.state.values;
  const type = callbackId === 'update';

  // simplify the data from Slack a bit
  const data = {
    title: values.title_block.title.value,
    date: values.date_block?.date?.selected_date,
    description: values.description_block.description.value,
  };

  // set the fields as Notion properties to populate the database entry
  const props: UpdateEntry = {
    project: properties.title(data.title),
  };

  // try to find the Notion user using the Slack user's email
  const slackUser = await slackApi(`users.info?user=${payload.user.id}`);
  const email = slackUser.user?.profile?.email || false;
  const notionUser = email ? await getUserByEmail(email) : false;

  if (notionUser && notionUser.id) {
    props.author = { people: [{ id: notionUser.id }] };
  }

  if (data.date) {
    props.date = properties.date(data.date);
  }

  // if a description was set, add it as the page content
  const children: object[] = [];

  if (data.description) {
    children.push(blocks.paragraph(data.description));
  }

  // create the request in Notion
  const notionRes = await notionApi('/pages', {
    parent: { database_id: process.env.NOTION_DB_ID },
    properties: convertEasyKeysToNotionData(props),
    children,
  });

  if (notionRes.object === 'error') {
    console.log(notionRes);
  }

  // build a permalink to the new request
  const requestLink = new URL(notionPageUrl);
  requestLink.searchParams.set('p', notionRes.id.replace(/-/g, ''));
  requestLink.searchParams.set('pm', 's');

  const userId = payload.user.id;

  const link = `<${requestLink.toString()}|${data.title}>`;

  // send a note to Slack so the team knows a new request has been sent
  await slackApi('chat.postMessage', {
    channel: process.env.SLACK_CHANNEL_ID,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `New DXE ${type} from <@${userId}>: ${link}`,
        },
      },
    ],
  });

  return {
    statusCode: 200,
    body: '',
  };
}

export const handler: Handler = async (event) => {
  if (!event.body) {
    return { statusCode: 500, body: 'invalid payload' };
  }

  const body = parse(event.body);
  const payload = JSON.parse(body.payload as string);
  const callbackId = payload?.view?.callback_id ?? payload?.callback_id;

  let response;

  switch (callbackId) {
    case 'integrations.update':

    default:
      response = {
        statusCode: 422,
        status: 'Unprocessable entity',
      };
  }

  return response;
};
