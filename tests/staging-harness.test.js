// In-process staging only: real handlers, fictional upstreams, no listener or network.
const test = require("node:test");
const assert = require("node:assert/strict");
const announcements = require("../netlify/functions/announcements").handler;
const embed = require("../netlify/functions/embed").handler;
const publicFeed = require("../netlify/functions/gradelink-public").handler;

function page(id, category = "Public", featured = false) {
  return { id, last_edited_time: featured ? "2026-09-02T12:00:00Z" : "2026-09-03T12:00:00Z", properties: {
    Title: { type: "title", title: [{ plain_text: `SYNTHETIC ${id}` }] },
    Category: { type: "select", select: { name: category } },
    "Publish Date": { date: { start: "2000-01-01" } },
    "Close Date": { date: { start: "2099-01-01" } },
    Featured: { checkbox: featured }, "Visible?": { checkbox: false },
    "Internal Notes": { type: "rich_text", rich_text: [{ plain_text: "DO-NOT-PROJECT" }] },
  } };
}

test("synthetic staging: handler boundaries (no production credentials or network)", async (t) => {
  const calendar = (await import("../netlify/functions/calendar.mjs")).default;
  const saved = [process.env.NOTION_TOKEN, process.env.NOTION_DATABASE_ID];
  process.env.NOTION_TOKEN = "synthetic-only";
  process.env.NOTION_DATABASE_ID = "synthetic-only";
  t.after(() => ["NOTION_TOKEN", "NOTION_DATABASE_ID"].forEach((key, i) => {
    if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i];
  }));
  t.mock.method(console, "error", () => {});
  let authStatus = 204, authThrows = false, sourceFails = false, sourceCalls = 0;
  let rows = [];
  const unexpected = [];
  const scopes = [];
  // No passthrough: even an unexpected fetch cannot reach a provider.
  t.mock.method(global, "fetch", async (input, options = {}) => {
    const url = new URL(input);
    if (url.origin === "https://app.bynesaints.org" && url.pathname === "/api/portal-access") {
      scopes.push(url.searchParams.get("scope"));
      assert.equal(options.headers.Authorization, "Bearer synthetic-capability");
      if (authThrows) throw new Error("synthetic outage");
      return new Response(null, { status: authStatus });
    }
    if (url.href === "https://api.notion.com/v1/databases/synthetic-only/query") {
      sourceCalls++;
      assert.equal(options.method, "POST");
      assert.equal(options.headers.authorization, "Bearer synthetic-only");
      return new Response(JSON.stringify({ results: rows, has_more: false }), { status: sourceFails ? 503 : 200 });
    }
    if (url.origin === "https://calendar.planningcenteronline.com" && url.pathname.startsWith("/icals/")) {
      sourceCalls++;
      return new Response("BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:SYNTHETIC calendar\nDTSTART;VALUE=DATE:20260924\nEND:VEVENT\nEND:VCALENDAR");
    }
    unexpected.push(url.origin + url.pathname);
    throw new Error("Harness blocked unexpected outbound request");
  });
  const routes = [
    { name: "announcements", scope: "announcements", invoke: (headers) => announcements({ headers }) },
    { name: "embed", scope: "announcements", invoke: (headers) => embed({ headers }) },
    { name: "calendar", scope: "calendar", invoke: (headers) => calendar(new Request("https://synthetic.invalid/?type=academic", { headers })) },
  ];
  for (const route of routes) {
    await t.test(`${route.name}: missing credential denied before upstream read`, async () => {
      sourceCalls = 0; scopes.length = 0;
      const response = await route.invoke({});
      assert.equal(response.statusCode ?? response.status, 401);
      assert.equal(sourceCalls, 0); assert.deepEqual(scopes, []);
    });
    for (const scenario of [{ name: "wrong scope", status: 403 }, { name: "revoked", status: 401 }, { name: "non-authorizing 200", status: 200 }, { name: "broker outage", status: 503, throws: true }, { name: "authorized", status: 204 }]) {
      await t.test(`${route.name}: simulated broker ${scenario.name}`, async () => {
        authStatus = scenario.status; authThrows = Boolean(scenario.throws);
        sourceCalls = 0; scopes.length = 0; rows = [page("staff-fixture")];
        const response = await route.invoke({ authorization: "Bearer synthetic-capability" });
        const allowed = scenario.status === 204;
        assert.equal(response.statusCode ?? response.status, allowed ? 200 : 401);
        assert.deepEqual(scopes, [route.scope]);
        assert.equal(sourceCalls, allowed ? 1 : 0);
      });
    }
  }
  await t.test("anonymous public projection excludes internal/policy/expired and preserves nonfeatured", async () => {
    rows = [page("featured", "Public", true), page("regular"), page("internal", "Internal"), page("policy", "Policy")];
    const expired = page("expired"); expired.properties["Close Date"].date.start = "2000-01-02"; rows.push(expired);
    scopes.length = 0;
    const response = await publicFeed({ queryStringParameters: { view: "announcements" } });
    const items = JSON.parse(response.body).items;
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.deepEqual(items.map(x => x.id), ["regular", "featured"]);
    assert.deepEqual(items.filter(x => x.featured).map(x => x.id), ["featured"]);
    assert.deepEqual(Object.keys(items[0]).sort(), ["id", "title", "subtitle", "description", "contentUpload", "additionalImages", "badges", "tags", "featured", "category", "publishDate", "closeDate", "updatedAt", "link", "additionalLinks"].sort());
    assert.equal(response.body.includes("DO-NOT-PROJECT"), false);
    assert.deepEqual(scopes, []);
  });
  await t.test("source failure then empty recovery never returns prior items", async () => {
    sourceFails = true;
    let response = await publicFeed({ queryStringParameters: { view: "announcements" } });
    assert.equal(response.statusCode, 502);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(JSON.parse(response.body).items, undefined);
    sourceFails = false; rows = [];
    response = await publicFeed({ queryStringParameters: { view: "announcements" } });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body).items, []);
  });
  await t.test("resources expose Policy only; unknown view rejected", async () => {
    rows = [page("public"), page("policy", "Policy"), page("internal", "Internal")];
    const response = await publicFeed({ queryStringParameters: { view: "resources" } });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body).items.map(x => x.id), ["policy"]);
    assert.equal(response.body.includes("DO-NOT-PROJECT"), false);
    assert.equal((await publicFeed({ queryStringParameters: { view: "internal" } })).statusCode, 400);
  });
  assert.deepEqual(unexpected, [], "Unexpected fetches must fail the suite even if handlers catch them");
});
