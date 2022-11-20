import { Handler } from '@netlify/functions';
import { notionApi } from './utils/notion';
import { sendSendgridEmail } from './utils/sendgrid';
import { context, divider, header, markdown, slackApi } from './utils/slack';

interface NewsletterItem {
  id: string;
  team: string;
  headline: string;
  content: string;
  label: string;
  url: string;
}

interface TeamData {
  name: string;
  icon: string;
}

async function loadNewsletterData({ issue = '08' }): Promise<NewsletterItem[]> {
  const res = await notionApi(
    `/databases/${process.env.NOTION_NEWSLETTER_DB_ID}/query`,
    {
      filter: {
        and: [
          {
            property: 'Include In Newsletter',
            checkbox: {
              equals: true,
            },
          },
          {
            property: 'Newsletter Number',
            select: {
              equals: issue,
            },
          },
        ],
      },
    },
  );

  // simplify the Notion output
  const items = res.results.map((result) => {
    return {
      id: result.id,
      team: result.properties.Team.select.name,
      headline: result.properties.Headline.title[0]?.text?.content,
      content: result.properties.Description.rich_text[0]?.text?.content,
      label: result.properties['Button Label'].rich_text[0]?.text?.content,
      url: result.properties['URL for Sharing'].url,
    };
  });

  return items;
}

function formatSlackItemsByTeam(team, items: NewsletterItem[]) {
  const filteredItems = items.filter((item) => item.team === team.name);

  if (filteredItems.length === 0) {
    return [];
  }

  return [
    header(`:${team.icon}: ${team.name}`),
    divider(),
    ...filteredItems.map((item) => {
      return markdown(
        `*${item.headline}* — ${item.content}`,
        item.url,
        item.label,
      );
    }),
  ];
}

const teams: TeamData[] = [
  { name: 'DX Engineering', icon: 'appy' },
  { name: 'Docs', icon: 'disco' },
];

async function sendSlackMessage({ lede, items, channel }) {
  const itemsByTeam = teams
    .map((team) => formatSlackItemsByTeam(team, items))
    .flat();

  await slackApi('chat.postMessage', {
    channel,
    blocks: [
      markdown(lede),
      ...itemsByTeam,
      divider(),
      context(
        'If you have questions, please hit us up in <https://netlify.slack.com/archives/CCC1HDWQY|#crew-all-dx>!',
      ),
    ],
  });
}

function formatEmailItemsByTeam(team, items) {
  const filteredItems = items.filter((item) => item.team === team.name);

  if (filteredItems.length === 0) {
    return [];
  }

  const formattedItems = filteredItems.map((item) => {
    let link = '';
    if (item.url) {
      link = ` [<a href="${item.url}">${item.label}</a>]`;
    }

    return `<p><strong>${item.headline}</strong> — ${item.content}${link}</p>`;
  });

  return `
<h1>${team.name}</h2>
${formattedItems.join('\n')}
`;
}

async function sendEmail({ subject, lede, items, to, from, context }) {
  const itemsByTeam = teams
    .map((team) => formatEmailItemsByTeam(team, items))
    .flat();

  await sendSendgridEmail({
    to,
    from,
    subject,
    lede: lede.replace(/(\r\n|\n|\r)/gm, '</p><p>'),
    html: itemsByTeam.join(''),
    context,
  });
}

export const handler: Handler = async (request) => {
  const {
    channel = process.env.SLACK_CHANNEL_ID,
    issue = '07',
    subject = `DX Newsletter | ${new Date().toISOString().split('T')[0]}`,
    lede = 'Hey there capybuddies! Here’s what the DX team has been up to lately.',
    to = 'jason.lengstorf@netlify.com',
    from = 'noreply@ntl.fyi',
  } = JSON.parse(request.body || '{}');

  const items = await loadNewsletterData({ issue });

  sendSlackMessage({ lede, items, channel });
  sendEmail({
    subject,
    lede,
    items,
    to,
    from,
    context:
      'If you have questions, please hit us up in <a href="https://netlify.slack.com/archives/CCC1HDWQY">#crew-all-dx</a>!',
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(items, null, 2),
  };
};
