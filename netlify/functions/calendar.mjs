import portalAuth from "../lib/portal-auth.js";

const { authorizePortalRequest } = portalAuth;

const FEEDS = {
  athletics:
    "https://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VTiNjIwNDI1YbPmDLFiLwMK8AGl40syc1OLwWLcBYlFibnFQEPZixOBSopT3IBEnhsAM9Qa5A==5c0cec983274631ecba22ff87c0386616977b467",
  academic:
    "https://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VSSNDI1NDE31jEyMDQygVImbNacIVbsZUBpPqDi-JLM3NRisBh3QWJRYm4x0Ar24kSgkuIUNyCR5wYAhPcdqw==0cad58f2a92ce9955fe682f1c012b2bbeb1e11f9",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}

function unfoldIcs(value) {
  return value.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function parseProperty(line) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) return null;

  const rawName = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1);
  const [name, ...parameterPairs] = rawName.split(";");
  const parameters = Object.fromEntries(
    parameterPairs.map((pair) => {
      const [key, parameterValue = ""] = pair.split("=");
      return [key.toUpperCase(), parameterValue];
    }),
  );

  return {
    name: name.toUpperCase(),
    parameters,
    value,
  };
}

function cleanText(value = "") {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value, parameters = {}) {
  if (!value) return null;

  if (parameters.VALUE === "DATE" || /^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return value;

  const [, year, month, day, hour, minute, second, zulu] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${zulu ? "Z" : ""}`;
}

function dateKey(value) {
  return value?.slice(0, 10) || "";
}

function parseIcs(ics) {
  const events = [];
  let currentEvent = null;

  for (const line of unfoldIcs(ics)) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent?.title && currentEvent.start) {
        currentEvent.startDate = dateKey(currentEvent.start);
        currentEvent.endDate = dateKey(currentEvent.end);
        events.push(currentEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;

    const property = parseProperty(line);
    if (!property) continue;

    if (property.name === "SUMMARY") currentEvent.title = cleanText(property.value);
    if (property.name === "DESCRIPTION") currentEvent.description = cleanText(property.value);
    if (property.name === "LOCATION") currentEvent.location = cleanText(property.value);
    if (property.name === "URL") currentEvent.url = cleanText(property.value);
    if (property.name === "DTSTART") currentEvent.start = parseIcsDate(property.value, property.parameters);
    if (property.name === "DTEND") currentEvent.end = parseIcsDate(property.value, property.parameters);
  }

  return events.sort((a, b) => String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title));
}

export default async (request) => {
  const event = { headers: Object.fromEntries(request.headers.entries()) };
  if (!(await authorizePortalRequest(event, "calendar"))) {
    return jsonResponse({ error: "Portal access is not authorized." }, 401);
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const feedUrl = FEEDS[type];

  if (!feedUrl) {
    return jsonResponse({ error: "Unknown calendar type." }, 400);
  }

  try {
    const feedResponse = await fetch(feedUrl, {
      headers: { "user-agent": "BCS Communications Hub" },
    });

    if (!feedResponse.ok) {
      return jsonResponse({ error: "Unable to load calendar feed." }, 502);
    }

    const ics = await feedResponse.text();
    return jsonResponse({
      type,
      events: parseIcs(ics),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Unable to parse calendar feed." }, 502);
  }
};
