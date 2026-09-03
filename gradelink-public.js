(() => {
  const view = new URLSearchParams(window.location.search).get("page") || "announcements";
  if (view === "announcements") return;
  const labels = { resources: "RESOURCES", academic: "ACADEMIC CALENDAR", athletics: "ATHLETICS CALENDAR" };
  if (!labels[view]) return;
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const formatDate = (value) => {
    if (!value) return "";
    const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
    const date = match ? new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`) : new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  document.title = `BCS ${labels[view]}`;
  document.querySelector(".top h1").textContent = labels[view];
  document.querySelector(".top .grid")?.remove();
  document.querySelectorAll(".public-nav a").forEach((link) => link.toggleAttribute("aria-current", link.dataset.view === view));
  const main = document.querySelector(".main .wrap");
  const calendarLinks = {
    athletics: "webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VTiNjIwNDI1YbPmDLFiLwMK8AGl40syc1OLwWLcBYlFibnFQEPZixOBSopT3IBEnhsAM9Qa5A==5c0cec983274631ecba22ff87c0386616977b467",
    academic: "webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VSSNDI1NDE31jEyMDQygVImbNacIVbsZUBpPqDi-JLM3NRisBh3QWJRYm4x0Ar24kSgkuIUNyCR5wYAhPcdqw==0cad58f2a92ce9955fe682f1c012b2bbeb1e11f9",
  };
  if (calendarLinks[view]) {
    const name = view === "athletics" ? "BCS Athletics" : "BCS Academic";
    main.innerHTML = `<h2>${labels[view]}</h2><article class="calendar-item"><div><h3>${name} Calendar</h3><p>Subscribe in Apple Calendar, Google Calendar, Outlook, or another calendar app.</p><p><a href="${calendarLinks[view]}">Open ${name}</a></p></div></article>`;
    return;
  }
  main.innerHTML = `<p class="public-loading">Loading ${labels[view].toLowerCase()}…</p>`;
  fetch(`/.netlify/functions/gradelink-public?view=${encodeURIComponent(view)}`)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Request failed: ${response.status}`)))
    .then((payload) => {
      if (view === "resources") {
        main.innerHTML = `<h2>POLICIES &amp; RESOURCES</h2><div class="grid announcement-grid">${payload.items.map((item) => `<article class="card">${item.contentUpload ? `<img src="${escapeHTML(item.contentUpload)}" alt="${escapeHTML(item.title)}">` : ""}<div class="card-body"><h3>${escapeHTML(item.title)}</h3>${item.subtitle ? `<p class="subtitle">${escapeHTML(item.subtitle)}</p>` : ""}${item.description ? `<details open><summary>Description</summary><p>${escapeHTML(item.description)}</p></details>` : ""}${[item.link, item.additionalLink].filter(Boolean).map((url) => `<div class="links"><a href="${escapeHTML(url)}" target="_blank" rel="noreferrer">Open resource</a></div>`).join("")}</div></article>`).join("") || "<p>No parent resources are available right now.</p>"}</div>`;
      } else {
        main.innerHTML = `<h2>${labels[view]}</h2><div class="calendar-list">${payload.events.map((event) => `<article class="calendar-item"><p class="calendar-date">${escapeHTML(formatDate(event.start))}</p><div><h3>${escapeHTML(event.title)}</h3>${event.location ? `<p class="subtitle">${escapeHTML(event.location)}</p>` : ""}${event.description ? `<p>${escapeHTML(event.description)}</p>` : ""}${event.url ? `<a href="${escapeHTML(event.url)}" target="_blank" rel="noreferrer">Event details</a>` : ""}</div></article>`).join("") || "<p>No calendar events are available right now.</p>"}</div>`;
      }
    })
    .catch(() => { main.innerHTML = `<p>Unable to load this page right now.</p>`; });
})();
