const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

const OUTPUT_PATH = path.join(__dirname, "..", "gradelink-static.html");
const IMAGE_OUTPUT_DIR = path.join(__dirname, "..", "assets", "gradelink");
const SOURCE_URL = "https://bcs-communications-portal.netlify.app/.netlify/functions/announcements";

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

function slugify(value) {
  return String(value || "announcement")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "announcement";
}

function extensionFromContentType(contentType) {
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/webp")) return ".webp";
  if (contentType.includes("image/gif")) return ".gif";
  if (contentType.includes("image/svg")) return ".svg";
  return ".jpg";
}

async function localizeImage(item) {
  if (!item.contentUpload) return item;

  try {
    const response = await fetch(item.contentUpload);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return { ...item, contentUpload: "" };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
    const filename = `${slugify(item.title)}-${hash}${extensionFromContentType(contentType)}`;
    const filePath = path.join(IMAGE_OUTPUT_DIR, filename);

    fs.mkdirSync(IMAGE_OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(filePath, buffer);

    return { ...item, contentUpload: `assets/gradelink/${filename}` };
  } catch (error) {
    console.warn(`Skipping image for ${item.title}: ${error.message}`);
    return { ...item, contentUpload: "" };
  }
}

async function localizeImages(items) {
  fs.rmSync(IMAGE_OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMAGE_OUTPUT_DIR, { recursive: true });

  const localized = [];
  for (const item of items) {
    localized.push(await localizeImage(item));
  }
  return localized;
}

function badgeMarkup(badges = []) {
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
        ${item.description ? `<details open><summary>Description</summary><p>${escapeHTML(item.description.trim())}</p></details>` : ""}
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
    <title>BCS Communications Static</title>
    <style>
      :root { color-scheme: light; --navy: #132f44; --blue: #d1e5f9; --ink: #1f2f3f; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--blue); color: var(--ink); font-family: Arial, Helvetica, sans-serif; }
      .top { background: var(--navy); color: white; padding: 28px 18px 34px; }
      .main { padding: 30px 18px 46px; }
      .wrap { width: min(1180px, 100%); margin: 0 auto; }
      .public-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
      .public-nav a { border: 1px solid rgba(255,255,255,0.55); border-radius: 999px; color: white; font-size: 0.82rem; font-weight: 800; padding: 8px 12px; text-decoration: none; }
      .public-nav a[aria-current] { background: white; color: var(--navy); }
      h1, h2, h3, p { margin: 0; }
      h1, h2 { font-size: 1.05rem; letter-spacing: 0; font-weight: 800; }
      .grid { display: grid; gap: 18px; margin-top: 20px; }
      .featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .announcement-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .card { overflow: hidden; border-radius: 8px; background: white; box-shadow: 0 10px 22px rgba(12, 30, 45, 0.1); }
      .card img { display: block; width: 100%; height: clamp(180px, 42vw, 280px); object-fit: contain; object-position: center; background: #f7f9fb; }
      .featured-card img { height: clamp(200px, 45vw, 320px); }
      .card-body { display: grid; gap: 10px; padding: 18px; }
      .badges { display: flex; flex-wrap: wrap; gap: 7px; }
      .badges span { display: inline-flex; border-radius: 999px; padding: 5px 9px; background: #e7f0fb; color: #174263; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
      h3 { color: #1f2f3f; font-size: 1.04rem; line-height: 1.25; }
      .subtitle, details p { color: #42546a; font-size: 0.94rem; line-height: 1.48; }
      details { border-top: 1px solid #e2e9f1; padding-top: 10px; }
      summary { color: #1f2f3f; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; }
      details p { margin-top: 9px; white-space: pre-line; }
      .links { display: grid; gap: 7px; }
      .links a { color: #174263; font-size: 0.88rem; overflow-wrap: anywhere; }
      .empty { margin-top: 18px; color: rgba(255,255,255,0.8); }
      .main .empty { color: #42546a; }
      .calendar-list { display: grid; gap: 12px; margin-top: 20px; }
      .calendar-item { display: grid; gap: 12px; grid-template-columns: 98px 1fr; background: white; border-radius: 8px; padding: 18px; }
      .calendar-date { color: #174263; font-weight: 800; }
      @media (max-width: 760px) { .top { padding: 22px 14px 28px; } .main { padding: 24px 14px 36px; } .featured-grid, .announcement-grid { grid-template-columns: 1fr; } .card-body { padding: 16px; } .calendar-item { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <section class="top">
      <div class="wrap">
        <nav class="public-nav" aria-label="Public portal pages">
          <a href="gradelink-static.html" data-view="announcements" aria-current="page">Announcements</a>
          <a href="gradelink-static.html?page=resources" data-view="resources">Resources</a>
          <a href="gradelink-static.html?page=academic" data-view="academic">Academic Calendar</a>
          <a href="gradelink-static.html?page=athletics" data-view="athletics">Athletics Calendar</a>
        </nav>
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
    <script src="gradelink-public.js"></script>
  </body>
</html>`;
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Unable to load announcements: ${response.status}`);

  const payload = await response.json();
  const items = payload.announcements || [];
  const livePublic = items.filter(isLivePublicItem).sort(compareAnnouncements);
  const localized = await localizeImages(livePublic);
  const featured = localized.filter((item) => isNonEmpty(item.featured));
  const announcements = localized.filter((item) => isNonEmpty(item.visible));

  fs.writeFileSync(OUTPUT_PATH, pageMarkup(featured, announcements).replace(/[ \t]+$/gm, ""));
  console.log(`Wrote ${OUTPUT_PATH} with ${featured.length} featured and ${announcements.length} announcements.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
