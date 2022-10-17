import type { RequestInit } from 'node-fetch';
import fetch from 'node-fetch';

type HeaderBlock = {
  type: 'header';
  text: {
    type: 'plain_text';
    text: string;
  };
};

type ContextBlock = {
  type: 'context';
  elements: [
    {
      type: 'mrkdwn';
      text: string;
    },
  ];
};

type DividerBlock = {
  type: 'divider';
};

type MarkdownBlock = {
  type: 'section';
  text: {
    type: 'mrkdwn';
    text: string;
  };
  accessory?: {
    type: 'button';
    text: {
      type: 'plain_text';
      text: string;
      emoji: true;
    };
    url: string;
    action_id: 'external-link';
  };
};

export function header(text: string): HeaderBlock {
  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text,
    },
  };
}

export function context(text: string): ContextBlock {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text,
      },
    ],
  };
}

export function divider(): DividerBlock {
  return {
    type: 'divider',
  };
}

export function markdown(
  text: string,
  buttonLink?: string,
  buttonText = 'Check It Out',
): MarkdownBlock {
  const block: MarkdownBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  };

  if (buttonLink) {
    block.accessory = {
      type: 'button',
      text: {
        type: 'plain_text',
        text: buttonText,
        emoji: true,
      },
      url: buttonLink,
      action_id: 'external-link',
    };
  }

  return block;
}

export function slackApi(endpoint: string, body?: object): Promise<any> {
  const options: RequestInit = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  if (body !== undefined) {
    options.method = 'POST';
    options.body = JSON.stringify(body);
  }

  return fetch(`https://slack.com/api/${endpoint}`, options).then((res) =>
    res.json(),
  );
}
