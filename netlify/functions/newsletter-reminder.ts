import { Handler, schedule } from '@netlify/functions';
import fetch from 'node-fetch';
import { header, context, divider, markdown } from './utils/slack';

const CAPYBARA_FACTS = [
  'Capybara Fact #1: HE CHONK. Capybaras are the largest rodents!',
  'Capybara Fact #2: Capybaras are strong swimmers. They have semi-webbed feet!',
  'Capybara Fact #3: Capybaras are BLAZING FAST. They can run up to 35mph!',
  'Capybara Fact #4: Dentists love ’em! Capybaras’ teeth never stop growing.',
  'Capybara Fact #5: A sleepy capybara can nap while swimming!',
];

const handlerFn: Handler = async () => {
  const random = Math.floor(Math.random() * CAPYBARA_FACTS.length);
  const msgHeader = ':wave: Greeting capybuddies! It’s that time again!';
  const msgLink =
    'https://www.notion.so/netlify/cdd79d3f92d146b7bfa12a170feb9ca7?v=33433890fa6c43fabbf2273677f688c8';
  const msgBody = `*Please update the DX Newsletter by EOD Friday.*

Let’s make sure our work is shared across the company. Please update the newsletter Notion for this week!`;

  const blocks = [
    header(msgHeader),
    divider(),
    markdown(msgBody, msgLink, 'Update the Newsletter'),
    divider(),
    context(CAPYBARA_FACTS[random]),
  ];

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL_ID,
      blocks,
    }),
  });

  return {
    statusCode: 200,
  };
};

export const handler = schedule('0 9 * * 3', handlerFn);
