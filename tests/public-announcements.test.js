const test = require("node:test");
const assert = require("node:assert/strict");
const { todayKey, publicAnnouncements } = require("../netlify/lib/public-announcements");
const { handler } = require("../netlify/functions/gradelink-public");
const now = new Date("2026-09-09T16:00:00Z");
const select = (name) => ({ type: "select", select: { name } });
const date = (start) => ({ type: "date", date: { start } });
function page(id, overrides = {}, edited = "2026-09-08T14:00:00Z") {
  return { id, last_edited_time: edited, properties: {
    Title: { type: "title", title: [{ plain_text: id }] }, Category: select("Public"),
    "Publish Date": date("2026-09-01"), "Close Date": date("2026-09-30"),
    Featured: { type: "checkbox", checkbox: false }, "Visible?": { type: "checkbox", checkbox: false },
    "Internal Notes": { type: "rich_text", rich_text: [{ plain_text: "PRIVATE-MARKER" }] },
    ...overrides,
  } };
}

test("live public filtering excludes private, scheduled, expired, invalid and archived records", () => {
  const rows = [page("live"), page("internal", { Category: select("Internal") }), page("policy", { Category: select("Policy") }),
    page("scheduled", { "Publish Date": date("2026-09-10") }), page("closes-today", { "Close Date": date("2026-09-09") }),
    page("invalid", { "Publish Date": date("2026-02-30") }), page("missing", { "Close Date": date(null) }),
    { ...page("archived"), archived: true }, { ...page("trash"), in_trash: true }];
  const items = publicAnnouncements(rows, now);
  assert.deepEqual(items.map((item) => item.id), ["live"]);
  assert.equal(JSON.stringify(items).includes("PRIVATE-MARKER"), false);
});

test("all live items include featured and non-featured even when legacy Visible is false; newest edit wins", () => {
  const items = publicAnnouncements([page("old-featured", { Featured: { checkbox: true } }), page("new-regular", {}, "2026-09-09T10:00:00Z")], now);
  assert.deepEqual(items.map((item) => item.id), ["new-regular", "old-featured"]);
  assert.deepEqual(items.filter((item) => item.featured).map((item) => item.id), ["old-featured"]);
});

test("Last Modified and exact additional-link names are mapped; unsafe links excluded", () => {
  const [item] = publicAnnouncements([page("links", {
    "Last Modified": { last_edited_time: "2026-09-09T15:00:00Z" },
    Link: { type: "url", url: "javascript:alert(1)" },
    "Additional Link ": { type: "url", url: "https://example.com/one" },
    "Additional Link 2": { type: "url", url: "https://example.com/two" },
  })], now);
  assert.equal(item.updatedAt, "2026-09-09T15:00:00.000Z");
  assert.equal(item.link, "");
  assert.equal(item.additionalLinks.length, 2);
});

test("school-day boundaries use New York, not server UTC", () => {
  assert.equal(todayKey(new Date("2026-09-10T03:59:59Z")), "2026-09-09");
  assert.equal(todayKey(new Date("2026-09-10T04:00:00Z")), "2026-09-10");
});

test("endpoint paginates, filters before returning and fetches changed source again", async (t) => {
  const oldToken = process.env.NOTION_TOKEN, oldId = process.env.NOTION_DATABASE_ID;
  process.env.NOTION_TOKEN = "synthetic-test-token"; process.env.NOTION_DATABASE_ID = "synthetic-database";
  t.after(() => { if (oldToken === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = oldToken; if (oldId === undefined) delete process.env.NOTION_DATABASE_ID; else process.env.NOTION_DATABASE_ID = oldId; });
  let calls = 0;
  t.mock.method(global, "fetch", async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.filter.and[0].select.equals, "Public");
    assert.equal(request.sorts[0].direction, "descending");
    calls++;
    const active = (id) => page(id, { "Publish Date": date("2020-01-01"), "Close Date": date("2099-01-01") });
    return { ok: true, json: async () => calls === 1 ? { results: [active("first"), page("private", { Category: select("Internal") })], has_more: true, next_cursor: "cursor2" } : { results: [active(calls === 2 ? "second" : "new-edit")], has_more: false } };
  });
  const first = await handler({ queryStringParameters: { view: "announcements" } });
  assert.equal(first.statusCode, 200);
  assert.equal(first.headers["cache-control"], "no-store");
  assert.deepEqual(JSON.parse(first.body).items.map((x) => x.id), ["first", "second"]);
  const second = await handler({ queryStringParameters: { view: "announcements" } });
  assert.deepEqual(JSON.parse(second.body).items.map((x) => x.id), ["new-edit"]);
});

test("public source failure returns an error rather than a dated fallback", async (t) => {
  t.mock.method(global, "fetch", async () => ({ ok: false, status: 503 }));
  t.mock.method(console, "error", () => {});
  const result = await handler({ queryStringParameters: { view: "announcements" } });
  assert.equal(result.statusCode, 502);
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(JSON.parse(result.body).items, undefined);
});
