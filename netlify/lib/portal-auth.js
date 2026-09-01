const TEAM_APP_ORIGIN = "https://app.bynesaints.org";
const MAX_TOKEN_LENGTH = 4096;

function bearerToken(headers = {}) {
  const value = headers.authorization || headers.Authorization || "";
  if (!value.startsWith("Bearer ")) return "";
  const token = value.slice(7).trim();
  return token.length <= MAX_TOKEN_LENGTH ? token : "";
}

async function authorizePortalRequest(event, scope) {
  const token = bearerToken(event?.headers);
  if (!token) return false;
  try {
    const response = await fetch(`${TEAM_APP_ORIGIN}/api/portal-access?scope=${encodeURIComponent(scope)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(7_500),
    });
    return response.status === 204;
  } catch (error) {
    console.error("Portal authorization check failed.", error);
    return false;
  }
}

function unauthorizedResponse(contentType = "application/json; charset=utf-8") {
  return {
    statusCode: 401,
    headers: { "content-type": contentType, "cache-control": "private, no-store" },
    body: contentType.startsWith("application/json")
      ? JSON.stringify({ error: "Portal access is not authorized." })
      : "<p>Portal access is not authorized.</p>",
  };
}

module.exports = { authorizePortalRequest, bearerToken, unauthorizedResponse };
