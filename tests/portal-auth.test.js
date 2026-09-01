const test = require("node:test");
const assert = require("node:assert/strict");
const { authorizePortalRequest, bearerToken, unauthorizedResponse } = require("../netlify/lib/portal-auth");

test("bearerToken rejects absent, malformed, and oversized credentials", () => {
  assert.equal(bearerToken({}), "");
  assert.equal(bearerToken({ authorization: "Basic value" }), "");
  assert.equal(bearerToken({ authorization: `Bearer ${"a".repeat(4097)}` }), "");
});

test("authorization fails closed when Team App rejects the capability", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ status: 401 });
  try {
    assert.equal(await authorizePortalRequest({ headers: { authorization: "Bearer signed-token" } }, "announcements"), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("authorization accepts only a Team App 204", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, "https://app.bynesaints.org/api/portal-access?scope=calendar");
    assert.equal(options.headers.Authorization, "Bearer signed-token");
    return { status: 204 };
  };
  try {
    assert.equal(await authorizePortalRequest({ headers: { authorization: "Bearer signed-token" } }, "calendar"), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("unauthorized responses are private and generic", () => {
  const response = unauthorizedResponse();
  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["cache-control"], "private, no-store");
  assert.deepEqual(JSON.parse(response.body), { error: "Portal access is not authorized." });
});
