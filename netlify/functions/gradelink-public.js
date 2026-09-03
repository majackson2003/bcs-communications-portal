const NOTION_VERSION = "2022-06-28";

const CALENDAR_FEEDS = {
  athletics: "https://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VTiNjIwNDI1YbPmDLFiLwMK8AGl40syc1OLwWLcBYlFibnFQEPZixOBSopT3IBEnhsAM9Qa5A==5c0cec983274631ecba22ff87c0386616977b467",
  academic: "https://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VSSNDI1NDE31jEyMDQygVImbNacIVbsZUBpPqDi-JLM3NRisBh3QWJRYm4x0Ar24kSgkuIUNyCR5wYAhPcdqw==0cad58f2a92ce9955fe682f1c012b2bbeb1e11f9",
};

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300, stale-while-revalidate=900" },
    body: JSON.stringify(body),
  };
}

function plainText(property) {
  if (!property) return "";
  if (property.type === "title") return property.title?.map((part) => part.plain_text).join("").trim() || "";
  if (property.type === "rich_text") return property.rich_text?.map((part) => part.plain_text).join("").trim() || "";
  if (property.type === "url") return property.url || "";
  return "";
}

function selectList(property) {
  if (!property) return [];
  if (property.type === "multi_select") return property.multi_select.map((item) => item.name);
  if (property.type === "select" && property.select?.name) return [property.select.name];
  return [];
}

function fileUrl(property) {
  const file = property?.files?.[0];
  return file?.type === "external" ? file.external?.url || "" : file?.file?.url || "";
}

function mapPage(page) {
  const properties = page.properties || {};
  return {
    title: plainText(properties.Title), subtitle: plainText(properties.Subtitle), description: plainText(properties.Description),
    contentUpload: fileUrl(properties["Content Upload"]), badges: selectList(properties.Badges), category: plainText(properties.Category),
    priority: Number(plainText(properties.Priority)) || 999, pinned: Boolean(properties.Pinned?.checkbox),
    link: plainText(properties.Link), additionalLink: plainText(properties["Additional Link"]),
  };
}

async function policyResources() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return [];
  const pages = [];
  let startCursor;
  do {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "notion-version": NOTION_VERSION },
      body: JSON.stringify({ page_size: 100, ...(startCursor ? { start_cursor: startCursor } : {}) }),
    });
    if (!response.ok) throw new Error(`Notion API error ${response.status}`);
    const payload = await response.json();
    pages.push(...payload.results.map(mapPage));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
  } while (startCursor);
  return pages.filter((item) => item.category === "Policy").sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.priority - b.priority);
}

function clean(value = "") { return value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim(); }

function calendarEvents(ics) {
  const events = []; let event = null;
  for (const line of ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/)) {
    if (line === "BEGIN:VEVENT") { event = {}; continue; }
    if (line === "END:VEVENT") { if (event?.title && event.start) events.push(event); event = null; continue; }
    if (!event) continue;
    const colon = line.indexOf(":"); if (colon < 0) continue;
    const [name] = line.slice(0, colon).split(";"); const value = clean(line.slice(colon + 1));
    if (name === "SUMMARY") event.title = value;
    if (name === "LOCATION") event.location = value;
    if (name === "DESCRIPTION") event.description = value;
    if (name === "URL") event.url = value;
    if (name === "DTSTART") event.start = value;
    if (name === "DTEND") event.end = value;
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}

exports.handler = async (event) => {
  const view = event.queryStringParameters?.view;
  try {
    if (view === "resources") return json({ view, items: await policyResources() });
    if (view === "athletics" || view === "academic") {
      const response = await fetch(CALENDAR_FEEDS[view]);
      if (!response.ok) throw new Error(`Calendar error ${response.status}`);
      return json({ view, events: calendarEvents(await response.text()) });
    }
    return json({ error: "Unknown public portal view." }, 400);
  } catch (error) {
    console.error("Unable to build public Gradelink view.", error);
    return json({ error: "Unable to load this public portal page." }, 502);
  }
};
