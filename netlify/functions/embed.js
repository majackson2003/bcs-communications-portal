const NOTION_VERSION = "2022-06-28";
const { authorizePortalRequest, unauthorizedResponse } = require("../lib/portal-auth");

function response(statusCode, body, contentType = "text/html; charset=utf-8") {
  return {
    statusCode,
    headers: {
      "content-type": contentType,
      "cache-control": "private, no-store",
    },
    body,
  };
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function plainText(property) {
  if (!property) return "";
  if (property.type === "title") return property.title?.map((part) => part.plain_text).join("").trim() || "";
  if (property.type === "rich_text") return property.rich_text?.map((part) => part.plain_text).join("").trim() || "";
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

function fileUrl(property) {
  const firstFile = property?.files?.[0];
  if (!firstFile) return "";
  return firstFile.type === "external" ? firstFile.external?.url || "" : firstFile.file?.url || "";
}

function priorityValue(property) {
  if (!property) return 999;
  if (property.type === "number" && Number.isFinite(property.number)) return property.number;
  const parsed = Number(plainText(property));
  return Number.isFinite(parsed) ? parsed : 999;
}

function mapPage(page) {
  const properties = page.properties || {};
  return {
    title: plainText(properties.Title),
    subtitle: plainText(properties.Subtitle),
    description: plainText(properties.Description),
    contentUpload: fileUrl(properties["Content Upload"]),
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
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
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

    if (!notionResponse.ok) {
      const details = await notionResponse.text();
      throw new Error(`Notion API error ${notionResponse.status}: ${details}`);
    }

    const payload = await notionResponse.json();
    announcements.push(...payload.results.map(mapPage));
    startCursor = payload.has_more ? payload.next_cursor : undefined;
  } while (startCursor);

  return announcements;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function todayAtMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isNonEmpty(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function isLivePublicItem(item) {
  const today = todayAtMidnight();
  return (
    item.category === "Public" &&
    parseDate(item.publishDate) <= today &&
    parseDate(item.closeDate) > today
  );
}

function compareAnnouncements(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.priority - b.priority;
}

function badgeMarkup(badges) {
  if (!badges.length) return "";
  return `<div class="badges">${badges.map((badge) => `<span>${escapeHTML(badge)}</span>`).join("")}</div>`;
}

function linkMarkup(item) {
  const links = [
    ["Link", item.link],
    ["Additional Link", item.additionalLink],
  ].filter(([, url]) => url);

  if (!links.length) return "";

  return `<div class="links">${links
    .map(([label, url]) => `<a href="${escapeHTML(url)}" target="_blank" rel="noreferrer">${escapeHTML(label)}: ${escapeHTML(url)}</a>`)
    .join("")}</div>`;
}

function cardMarkup(item, featured = false) {
  return `
    <article class="card${featured ? " featured-card" : ""}">
      ${item.contentUpload ? `<img src="${escapeHTML(item.contentUpload)}" alt="${escapeHTML(item.title)} artwork">` : ""}
      <div class="card-body">
        ${badgeMarkup(item.badges)}
        <h3>${escapeHTML(item.title)}</h3>
        ${item.subtitle ? `<p class="subtitle">${escapeHTML(item.subtitle)}</p>` : ""}
        ${item.description ? `<details><summary>Description</summary><p>${escapeHTML(item.description)}</p></details>` : ""}
        ${linkMarkup(item)}
      </div>
    </article>
  `;
}

function pageMarkup(featured, announcements) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BCS Communications Embed</title>
    <style>
      :root { color-scheme: light; --navy: #132f44; --blue: #d1e5f9; --ink: #1f2f3f; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--blue); color: var(--ink); font-family: Arial, Helvetica, sans-serif; }
      .top { background: var(--navy); color: white; padding: 28px 18px 34px; }
      .main { padding: 30px 18px 46px; }
      .wrap { width: min(1180px, 100%); margin: 0 auto; }
      h1, h2, h3, p { margin: 0; }
      h1, h2 { font-size: 1.05rem; letter-spacing: 0; font-weight: 800; }
      .grid { display: grid; gap: 18px; margin-top: 20px; }
      .featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .announcement-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .card { overflow: hidden; border-radius: 8px; background: white; box-shadow: 0 10px 22px rgba(12, 30, 45, 0.1); }
      .card img { display: block; width: 100%; height: 230px; object-fit: cover; object-position: top center; background: #edf3f8; }
      .featured-card img { height: 320px; }
      .card-body { display: grid; gap: 10px; padding: 18px; }
      .badges { display: flex; flex-wrap: wrap; gap: 7px; }
      .badges span { display: inline-flex; border-radius: 999px; padding: 5px 9px; background: #e7f0fb; color: #174263; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
      h3 { color: #1f2f3f; font-size: 1.04rem; line-height: 1.25; }
      .subtitle, details p { color: #42546a; font-size: 0.94rem; line-height: 1.48; }
      details { border-top: 1px solid #e2e9f1; padding-top: 10px; }
      summary { cursor: pointer; color: #1f2f3f; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; }
      details p { margin-top: 9px; white-space: pre-line; }
      .links { display: grid; gap: 7px; }
      .links a { color: #174263; font-size: 0.88rem; overflow-wrap: anywhere; }
      .empty { margin-top: 18px; color: rgba(255,255,255,0.8); }
      .main .empty { color: #42546a; }
      @media (max-width: 820px) { .featured-grid, .announcement-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { .featured-grid, .announcement-grid { grid-template-columns: 1fr; } .card img, .featured-card img { height: auto; } }
    </style>
  </head>
  <body>
    <section class="top">
      <div class="wrap">
        <h1>FEATURED</h1>
        ${
          featured.length
            ? `<div class="grid featured-grid">${featured.map((item) => cardMarkup(item, true)).join("")}</div>`
            : `<p class="empty">No results found, try adjusting your search and filters.</p>`
        }
      </div>
    </section>
    <section class="main">
      <div class="wrap">
        <h2>NEW &amp; ANNOUNCEMENTS</h2>
        ${
          announcements.length
            ? `<div class="grid announcement-grid">${announcements.map((item) => cardMarkup(item)).join("")}</div>`
            : `<p class="empty">No results found, try adjusting your search and filters.</p>`
        }
      </div>
    </section>
  </body>
</html>`;
}

exports.handler = async (event) => {
  if (!(await authorizePortalRequest(event, "announcements"))) return unauthorizedResponse("text/html; charset=utf-8");

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return response(500, "<p>Announcements are not configured.</p>");
  }

  try {
    const items = await queryNotionDatabase(databaseId, token);
    const livePublic = items.filter(isLivePublicItem).sort(compareAnnouncements);
    const featured = livePublic.filter((item) => isNonEmpty(item.featured));
    const announcements = livePublic.filter((item) => isNonEmpty(item.visible));

    return response(200, pageMarkup(featured, announcements));
  } catch (error) {
    console.error(error);
    return response(502, "<p>Unable to load announcements.</p>");
  }
};
