import type { Handler } from '@netlify/functions';
import { parse } from 'querystring';
import {
  notionApi,
  convertNotionDataToEasyKeys,
  notionPageUrl,
} from './utils/notion';
import { slackApi } from './utils/slack';

async function getRequestModalBlocks(commandText: string) {
  // load dropdown options from Notion
  const notionData = await notionApi(`/databases/${process.env.NOTION_DB_ID}`);
  const dbData = convertNotionDataToEasyKeys(notionData.properties);

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Fill out this form to submit a new project update! Or, if you prefer, you can <${notionPageUrl}|create your update in Notion>.`,
      },
    },
    {
      block_id: 'project_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'Wha project?',
      },
      element: {
        action_id: 'project',
        type: 'plain_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Example: Planetscale to Labs',
        },
        initial_value: commandText,
      },
      hint: {
        type: 'plain_text',
        text: 'Do not mess this up',
      },
    },
    {
      block_id: 'date_block',
      type: 'input',
      element: {
        type: 'datepicker',
        placeholder: {
          type: 'plain_text',
          text: 'Select a date',
          emoji: true,
        },
        action_id: 'date',
      },
      label: {
        type: 'plain_text',
        text: 'What day is it?',
        emoji: true,
      },
      hint: {
        type: 'plain_text',
        text: 'What day is this update for?',
      },
      optional: true,
    },
    {
      block_id: 'description_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'What is up?',
      },
      element: {
        action_id: 'description',
        type: 'plain_text_input',
        multiline: true,
      },
      hint: {
        type: 'plain_text',
        text: 'Give us all the deets.',
      },
      optional: false,
    },
  ];
}

export const handler: Handler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 500,
      body: 'error',
    };
  }

  const body = parse(event.body);
  const { trigger_id, command, text } = body;

  let blocks;
  let callbackId;
  switch (command) {
    case '/integrations-update':
      blocks = await getRequestModalBlocks(text as string);
      callbackId = 'integrations.update';
      break;

    default:
      return {
        statusCode: 422,
        body: 'Unprocessable entity',
      };
  }

  const res = await slackApi('views.open', {
    trigger_id,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Submit an Integrations update.',
      },
      callback_id: callbackId,
      submit: {
        type: 'plain_text',
        text: 'Submit',
      },
      blocks,
    },
  });

  console.log(res);

  return {
    statusCode: 200,
    body: '',
  };
};
