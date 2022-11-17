import type { RequestInit } from 'node-fetch';
import { Client, collectPaginatedAPI } from '@notionhq/client';
import fetch from 'node-fetch';

export enum NOTION_TASK_STATUS {
  NEEDS_TRIAGE = 'Needs Triage',
  IDEA = 'Idea',
  READY = 'Ready',
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  DONE = 'Done',
  WILL_NOT_DO = 'Will Not Do',
  ARCHIVED = 'Archived',
}

export const notionPageUrl =
  'https://www.notion.so/b15a4092881a40afa819c2a4bf6bd513';

const props = {
  title: 'Name',
  author: 'Submitted By',
  date: 'Needed By',
  importance: 'Importance',
  status: 'Status',
};

export function convertNotionDataToEasyKeys(data) {
  return {
    title: data[props.title],
    author: data[props.author],
    date: data[props.date],
    importance: data[props.importance],
    status: data[props.status],
  };
}

export function convertEasyKeysToNotionData(data) {
  return {
    [props.title]: data.title,
    [props.author]: data.author,
    [props.date]: data.date,
    [props.importance]: data.importance,
    [props.status]: data.status,
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

type TitleProperty = {
  title: [{ text: { content: string } }];
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

type SelectProperty = {
  select: { name: string };
};

type StatusProperty = {
  status: {
    id?: string;
    name: string;
    color?: string;
  };
};

export type RequestEntry = {
  title: TitleProperty;
  author?: PeopleProperty;
  date?: DateProperty;
  importance?: SelectProperty;
  status?: StatusProperty;
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
  title(title): TitleProperty {
    return {
      title: [
        {
          text: {
            content: title,
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
  select(optionName): SelectProperty {
    return {
      select: {
        name: optionName,
      },
    };
  },
  status(optionName): StatusProperty {
    return {
      status: {
        name: optionName,
      },
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
