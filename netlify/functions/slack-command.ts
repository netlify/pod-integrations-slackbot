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
  const options = dbData.importance.select.options.map((option) => {
    return {
      text: {
        type: 'plain_text',
        text: option.name,
      },
      value: option.name,
    };
  });

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Fill out this form to submit a new DXE request! Or, if you prefer, you can <${notionPageUrl}|create your request in Notion>. Requests are reviewed twice weekly. If your request is urgent, notify <@UPD6LDBFG>.`,
      },
    },
    {
      block_id: 'title_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'What do you need?',
      },
      element: {
        action_id: 'title',
        type: 'plain_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Example: Run a DX audit on Netlify Graph in prep for Labs launch',
        },
        initial_value: commandText,
      },
      hint: {
        type: 'plain_text',
        text: 'Summarize your request in one sentence.',
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
        text: 'When do you need this by?',
        emoji: true,
      },
      hint: {
        type: 'plain_text',
        text: 'If your request doesn’t have a due date, we’ll treat it as an idea.',
      },
      optional: true,
    },
    {
      block_id: 'importance_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'What’s the importance of this request?',
      },
      element: {
        action_id: 'importance',
        type: 'static_select',
        options,
        initial_option: options.at(0),
      },
      hint: {
        type: 'plain_text',
        text: 'Is there any risk if we don’t do this?',
      },
    },
    {
      block_id: 'description_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'Additional details',
      },
      element: {
        action_id: 'description',
        type: 'plain_text_input',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'Example: Links to project plans, background, context, etc.',
        },
      },
      hint: {
        type: 'plain_text',
        text: 'Details help us to understand the goal, which helps us prioritize.',
      },
      optional: true,
    },
  ];
}

async function getIdeaModalBlocks(commandText: string) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Got a great idea for DXE? Capture it here! Ideas do not have deadlines or hard dependencies — they’re the “wouldn’t it be cool if...” ideas we don’t want to lose.',
      },
    },
    {
      block_id: 'title_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'What do you have in mind?',
      },
      element: {
        action_id: 'title',
        type: 'plain_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Example: Create an interactive library of examples for using Edge Functions',
        },
        initial_value: commandText,
      },
      hint: {
        type: 'plain_text',
        text: 'Summarize your idea in one sentence.',
      },
    },
    {
      block_id: 'description_block',
      type: 'input',
      label: {
        type: 'plain_text',
        text: 'Additional details',
      },
      element: {
        action_id: 'description',
        type: 'plain_text_input',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'Example: Why is this cool? How does it help? Who is it for?',
        },
      },
      hint: {
        type: 'plain_text',
        text: 'Details help us to understand the goal, which helps us prioritize.',
      },
      optional: true,
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
    case '/dxreq':
      blocks = await getRequestModalBlocks(text as string);
      callbackId = 'dx.submit-request';
      break;

    case '/dxidea':
      blocks = await getIdeaModalBlocks(text as string);
      callbackId = 'dx.submit-idea';
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
        text: 'Submit a DX Eng Request',
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
