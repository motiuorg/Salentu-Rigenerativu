import { Client } from '@notionhq/client';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

function getClient(): Client {
  const key = import.meta.env.NOTION_API_KEY;
  if (!key) throw new Error('NOTION_API_KEY is not set');
  return new Client({ auth: key });
}

export interface NormalizedRecord {
  id: string;
  url: string;
  icon?: string;
  createdTime: string;
  lastEditedTime: string;
  properties: Record<string, any>;
}

export interface SectionConfig {
  id: string;
  name: string;
  description: string;
  database_id: string | null;
  route: string;
  icon: string;
}

export function loadSectionConfig(): SectionConfig[] {
  const raw = fs.readFileSync('./src/data/databases.yaml', 'utf8');
  const parsed = yaml.load(raw) as { sections: SectionConfig[] };
  return parsed.sections;
}

export async function fetchDatabaseRecords(databaseId: string): Promise<NormalizedRecord[]> {
  const notion = getClient();
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  // Notion's new data-source architecture: for integrations on the new schema,
  // querying by database_id returns object_not_found. Fall back to querying the
  // database's data source (discovered via databases.retrieve) on the first 404.
  let dataSourceId: string | null = null;
  const queryPage = async (startCursor?: string): Promise<any> => {
    try {
      return await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
      });
    } catch (err: any) {
      if (err?.code !== "object_not_found") throw err;
      if (dataSourceId === null) {
        const db: any = await notion.databases.retrieve({ database_id: databaseId });
        dataSourceId = db?.data_sources?.[0]?.id ?? null;
        if (!dataSourceId) throw err;
      }
      return await notion.request({
        path: `/data_sources/${dataSourceId}/query`,
        method: "post",
        body: { start_cursor: startCursor },
      });
    }
  };

  do {
    const response = await queryPage(cursor);
    results.push(...response.results);
    cursor = response.next_cursor;
  } while (cursor);

  return results.map((page) => normalizePage(page));
}

export async function fetchPage(pageId: string): Promise<NormalizedRecord> {
  const notion = getClient();
  const page = await notion.pages.retrieve({ page_id: pageId });
  return normalizePage(page);
}

export function normalizePage(page: any): NormalizedRecord {
  const props = page.properties ?? {};
  return {
    id: page.id,
    url: page.url,
    icon: page.icon?.type === 'emoji' ? page.icon.emoji : undefined,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    properties: Object.fromEntries(
      Object.entries(props).map(([key, value]: [string, any]) => {
        return [key, extractValue(value)];
      })
    ),
  };
}

function extractValue(prop: any): any {
  switch (prop.type) {
    case 'title':
      return prop.title?.map((t: any) => t.plain_text).join('') ?? '';
    case 'rich_text':
      return prop.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
    case 'select':
      return prop.select?.name ?? null;
    case 'multi_select':
      return prop.multi_select?.map((s: any) => s.name) ?? [];
    case 'number':
      return prop.number ?? null;
    case 'url':
      return prop.url ?? null;
    case 'email':
      return prop.email ?? null;
    case 'phone_number':
      return prop.phone_number ?? null;
    case 'checkbox':
      return prop.checkbox ?? false;
    case 'relation':
      return prop.relation?.map((r: any) => r.id) ?? [];
    case 'formula':
      return prop.formula?.[prop.formula.type] ?? null;
    case 'rollup':
      return prop.rollup?.array?.map(extractValue) ?? [];
    case 'date':
      return prop.date;
    case 'people':
      return prop.people?.map((p: any) => ({ id: p.id, name: p.name })) ?? [];
    case 'files':
      return prop.files?.map((f: any) => f.external?.url ?? f.file?.url) ?? [];
    case 'location':
      return prop.location ?? null;
    default:
      const raw = prop[prop.type];
      if (raw === undefined || raw === null) return raw;
      if (typeof raw === 'object') return raw;
      return raw;
  }
}

export function buildRecordMap(records: NormalizedRecord[]): Map<string, NormalizedRecord> {
  return new Map(records.map((r) => [r.id, r]));
}

export function getTitle(record: NormalizedRecord): string {
  return String(record.properties['Name'] ?? record.properties['Title'] ?? record.properties['name'] ?? record.properties['title'] ?? 'Untitled');
}

export function getDescription(record: NormalizedRecord): string {
  return String(record.properties['Description'] ?? record.properties['description'] ?? '');
}

export function getUrl(record: NormalizedRecord): string | null {
  return record.properties['website'] ?? record.properties['Website'] ?? record.properties['URL'] ?? record.properties['Url'] ?? record.properties['url'] ?? null;
}

export function getPlace(record: NormalizedRecord): string {
  const place = record.properties['Place'] ?? record.properties['place'];
  if (place && typeof place === 'object') {
    if ('address' in place && place.address) return String(place.address);
    if ('name' in place && place.name) return String(place.name);
  }
  return String(
    record.properties['place'] ?? record.properties['Place'] ??
    record.properties['Scope'] ?? record.properties['scope'] ??
    record.properties['Location'] ?? record.properties['location'] ??
    ''
  );
}

export function getCategory(record: NormalizedRecord): string {
  return String(
    record.properties['category'] ?? record.properties['Category'] ??
    record.properties['type'] ?? record.properties['Type'] ??
    ''
  );
}
