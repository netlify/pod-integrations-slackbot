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
  buttonLink: string,
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
