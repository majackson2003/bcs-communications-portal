// Only this explicit projection is allowed to leave the public endpoint.
const schoolDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });

function todayKey(now = new Date()) {
  const parts = Object.fromEntries(schoolDate.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function text(property) {
  if (!property) return "";
  if (property.type === "title" || property.type === "rich_text") return (property[property.type] || []).map((part) => part.plain_text || "").join("").trim();
  if (property.type === "select") return property.select?.name || "";
  if (property.type === "url") return property.url || "";
  return "";
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function files(property) {
  return (property?.files || []).map((file) => safeUrl(file.type === "external" ? file.external?.url : file.file?.url)).filter(Boolean);
}

function list(property) {
  return property?.type === "multi_select" ? property.multi_select.map((value) => value.name) : [text(property)].filter(Boolean);
}

function dateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value || "")) return "";
  const day = value.slice(0, 10);
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : "";
}

function isLivePublicPage(page, today = todayKey()) {
  const p = page.properties || {};
  const publish = dateKey(p["Publish Date"]?.date?.start);
  const close = dateKey(p["Close Date"]?.date?.start);
  return !page.archived && !page.in_trash && text(p.Category) === "Public" && Boolean(publish && close) && publish <= today && close > today;
}

function mapPublicPage(page) {
  const p = page.properties || {};
  const timestamp = p["Last Modified"]?.last_edited_time || page.last_edited_time;
  const updatedAt = Number.isFinite(Date.parse(timestamp)) ? new Date(timestamp).toISOString() : "";
  return {
    id: page.id, title: text(p.Title), subtitle: text(p.Subtitle), description: text(p.Description),
    contentUpload: files(p["Content Upload"])[0] || "", additionalImages: files(p["Additional Images"]),
    badges: list(p.Badges), tags: list(p.Tags), featured: p.Featured?.checkbox === true,
    category: text(p.Category), publishDate: dateKey(p["Publish Date"]?.date?.start), closeDate: dateKey(p["Close Date"]?.date?.start),
    updatedAt, link: safeUrl(text(p.Link)),
    additionalLinks: [...new Set([p["Additional Link"], p["Additional Link "], p["Additional Link 2"]].map((value) => safeUrl(text(value))).filter(Boolean))],
  };
}

function publicAnnouncements(pages, now = new Date()) {
  const today = todayKey(now);
  return pages.filter((page) => isLivePublicPage(page, today)).map(mapPublicPage)
    .sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0) || a.id.localeCompare(b.id));
}

module.exports = { todayKey, isLivePublicPage, mapPublicPage, publicAnnouncements };
