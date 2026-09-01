const NOTION_VERSION = "2022-06-28";
const { authorizePortalRequest, unauthorizedResponse } = require("../lib/portal-auth");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
    },
    body: JSON.stringify(body),
  };
}

function plainText(property) {
  if (!property) return "";

  if (property.type === "title") {
    return property.title?.map((part) => part.plain_text).join("").trim() || "";
  }

  if (property.type === "rich_text") {
    return property.rich_text?.map((part) => part.plain_text).join("").trim() || "";
  }

  if (property.type === "url") return property.url || "";
  if (property.type === "email") return property.email || "";
  if (property.type === "phone_number") return property.phone_number || "";
  if (property.type === "select") return property.select?.name || "";
  if (property.type === "number") return property.number ?? "";
  if (property.type === "checkbox") return property.checkbox ? "true" : "";

  return "";
}

function dateValue(property) {
  return property?.date?.start || "";
}

function booleanValue(property) {
  if (!property) return false;
  if (property.type === "checkbox") return Boolean(property.checkbox);
  if (property.type === "select") return Boolean(property.select?.name);
  if (property.type === "multi_select") return property.multi_select.length > 0;
  return Boolean(plainText(property));
}

function selectList(property) {
  if (!property) return [];
  if (property.type === "multi_select") return property.multi_select.map((item) => item.name);
  if (property.type === "select" && property.select?.name) return [property.select.name];
  const text = plainText(property);
  return text ? [text] : [];
}

function fileUrls(property) {
  return (property?.files || [])
    .map((file) => (file.type === "external" ? file.external?.url || "" : file.file?.url || ""))
    .filter(Boolean);
}

function fileUrl(property) {
  return fileUrls(property)[0] || "";
}

function priorityValue(property) {
  if (!property) return 999;
  if (property.type === "number" && Number.isFinite(property.number)) return property.number;
  const text = plainText(property);
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 999;
}

function mapPage(page) {
  const properties = page.properties || {};

  return {
    id: page.id,
    title: plainText(properties.Title),
    subtitle: plainText(properties.Subtitle),
    description: plainText(properties.Description),
    contentUpload: fileUrl(properties["Content Upload"]),
    additionalImages: fileUrls(properties["Additional Images"]),
    badges: selectList(properties.Badges),
    tags: selectList(properties.Tags),
    category: plainText(properties.Category),
    publishDate: dateValue(properties["Publish Date"]),
    closeDate: dateValue(properties["Close Date"]),
    pinned: booleanValue(properties.Pinned),
    priority: priorityValue(properties.Priority),
    featured: booleanValue(properties.Featured),
    visible: booleanValue(properties["Visible?"]),
    link: plainText(properties.Link),
    additionalLink: plainText(properties["Additional Link"]),
  };
}

async function queryNotionDatabase(databaseId, token) {
  const announcements = [];
  let startCursor;

  do {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "notion-version": NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Notion API error ${response.status}: ${details}`);
    }

    const payload = await response.json();
    announcements.push(...payload.results.map(mapPage));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
  } while (startCursor);

  return announcements;
}

exports.handler = async (event) => {
  if (!(await authorizePortalRequest(event, "announcements"))) return unauthorizedResponse();

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return jsonResponse(200, {
      announcements: [],
      source: "fallback",
      configured: false,
    });
  }

  try {
    const announcements = await queryNotionDatabase(databaseId, token);
    return jsonResponse(200, {
      announcements,
      source: "notion",
      configured: true,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(502, {
      announcements: [],
      source: "notion",
      configured: true,
      error: "Unable to load announcements from Notion.",
    });
  }
};
