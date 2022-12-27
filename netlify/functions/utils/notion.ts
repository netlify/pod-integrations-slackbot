import type { RequestInit } from 'node-fetch';
import { Client, collectPaginatedAPI } from '@notionhq/client';
import fetch from 'node-fetch';
import { triggerAsyncId } from 'async_hooks';
import { stringify } from 'querystring';
import { url } from 'inspector';

export const notionPageUrl =
  'https://www.notion.so/45db28296d1c4c949f2ce6611f83474e';

const props = {
  project: 'Wha project?',
  author: 'Who you?',
  date: 'What day is it?',
  repo: 'There a repo? Link here.'
};

export function convertNotionDataToEasyKeys(data) {
  return {
    project: data[props.project],
    author: data[props.author],
    date: data[props.date],
    repo: data[props.repo],
  };
}

export function convertEasyKeysToNotionData(data) {
  return {
    [props.project]: data.title,
    [props.author]: data.author,
    [props.date]: data.date,
    [props.repo]: data.repo,
  };
}

const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_TOKEN,
});

export async function getUserByEmail(email) {
  console.log({ email });
  const users = await collectPaginatedAPI(notion.users.list, {
    page_size: 100,
  });

  const user = users.find((u) => {
    if (u.type !== 'person') {
      return false;
    }

    return u.person.email === email;
  });

  console.log({ user });

  return user;
}

type ProjectProperty = {
  project: [{ text: { content: string } }];
};

type RichTextProperty = {
  rich_text: [
    {
      type: 'text';
      text: { content: string };
    },
  ];
};

type DateProperty = {
  date: { start: string };
};

type PeopleProperty = {
  people: [{ id: string }];
};

type RepoProperty = {
  url: { repo?: string; };
};

export type UpdateEntry = {
  project: ProjectProperty;
  author?: PeopleProperty;
  date?: DateProperty;
  repo?: RepoProperty;
};

type ParagraphBlock = {
  type: 'paragraph';
  paragraph: RichTextProperty;
};

export function notionApi(endpoint: string, body?: object): Promise<any> {
  const options: RequestInit = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NOTION_INTEGRATION_TOKEN}`,
    },
  };

  if (body) {
    options.method = 'POST';
    options.body = JSON.stringify(body);
  }

  return fetch(`https://api.notion.com/v1${endpoint}`, options).then((res) =>
    res.json(),
  );
}

export const properties = {
  title(project): ProjectProperty {
    return {
      project: [
        {
          text: {
            content: project,
          },
        },
      ],
    };
  },
  richText(content): RichTextProperty {
    return {
      rich_text: [
        {
          type: 'text',
          text: { content },
        },
      ],
    };
  },
  date(date): DateProperty {
    return {
      date: {
        start: date,
      },
    };
  },
  url(repo): RepoProperty {
    return {
      url: repo,
    };
  },
};

export const blocks = {
  paragraph(content): ParagraphBlock {
    return {
      type: 'paragraph',
      paragraph: properties.richText(content),
    };
  },
};
