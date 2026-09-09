(() => {
  const requested = new URLSearchParams(location.search).get("page") || "announcements";
  const view = ["announcements", "resources", "academic", "athletics"].includes(requested) ? requested : "announcements";
  const calendarLinks = {
    athletics: "webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VTiNjIwNDI1YbPmDLFiLwMK8AGl40syc1OLwWLcBYlFibnFQEPZixOBSopT3IBEnhsAM9Qa5A==5c0cec983274631ecba22ff87c0386616977b467",
    academic: "webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2T2NGW04kotzi8oqea0YivNZM7q47Ziy_ZU4kjMyWGzYnMNsWIr8VSSNDI1NDE31jEyMDQygVImbNacIVbsZUBpPqDi-JLM3NRisBh3QWJRYm4x0Ar24kSgkuIUNyCR5wYAhPcdqw==0cad58f2a92ce9955fe682f1c012b2bbeb1e11f9",
  };
  const $ = (selector) => document.querySelector(selector);
  const els = {
    overview: $("[data-overview]"), detail: $("[data-detail]"), status: $("[data-status]"),
    refresh: $("[data-refresh]"), featuredSection: $("[data-featured-section]"),
    featured: $("[data-featured-grid]"), featuredEmpty: $("[data-featured-empty]"),
    grid: $("[data-grid]"), heading: $("[data-list-heading]"), toolbar: $("[data-toolbar]"),
    search: $("[data-search]"), filter: $("[data-filter]"), empty: $("[data-empty]"),
    results: $("[data-results]"), more: $("[data-load-more]"),
  };
  const state = { items: [], limit: 12, pending: false, error: false, scrollY: 0, trigger: "" };
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  const safeUrl = (value) => {
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; }
    catch { return ""; }
  };
  const external = (url, label, className = "") => '<a class="' + className + '" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
  const badges = (item) => '<span class="badges">' + (item.badges || []).map((badge) => '<span class="badge">' + escape(badge) + '</span>').join("") + '</span>';

  function card(item) {
    const image = safeUrl(item.contentUpload);
    return '<button type="button" class="card" data-item="' + escape(item.id) + '" aria-label="Open ' + escape(item.title) + '">' +
      '<span class="card-media">' + (image ? '<img loading="lazy" src="' + escape(image) + '" alt="' + escape(item.title) + ' artwork">' : '<span class="media-placeholder">Byne Christian School</span>') + '</span>' +
      '<span class="card-body">' + badges(item) + '<span class="card-title">' + escape(item.title) + '</span>' +
      (item.subtitle ? '<span class="card-subtitle">' + escape(item.subtitle) + '</span>' : '') + '</span></button>';
  }

  function renderOverview() {
    const featured = state.items.filter((item) => item.featured);
    els.featured.innerHTML = featured.map(card).join("");
    els.featuredEmpty.hidden = featured.length > 0;
    const query = els.search.value.trim().toLowerCase();
    const tag = els.filter.value;
    const filtered = state.items.filter((item) => {
      const content = [item.title, item.subtitle, item.description, ...(item.tags || []), ...(item.badges || []), item.link, ...(item.additionalLinks || [])].join(" ").toLowerCase();
      return (!query || content.includes(query)) && (!tag || (item.tags || []).includes(tag));
    });
    els.grid.innerHTML = filtered.slice(0, state.limit).map(card).join("");
    els.results.textContent = state.error ? "" : "Showing " + Math.min(filtered.length, state.limit) + " of " + filtered.length + (view === "resources" ? " resources" : " announcements");
    els.empty.hidden = filtered.length > 0;
    els.empty.textContent = state.error ? "Unable to load current content. Select Refresh to try again." : query || tag ? "No results match your search." : view === "resources" ? "No parent resources are available right now." : "No current public announcements.";
    els.more.hidden = filtered.length <= state.limit;
  }

  function detailId() {
    return new URLSearchParams(location.hash.slice(1)).get("item");
  }

  function showRoute(moveFocus = false) {
    const id = detailId();
    els.overview.hidden = Boolean(id);
    els.detail.hidden = !id;
    if (!id) {
      document.title = view === "resources" ? "BCS Resources" : "Byne Christian School Parent Portal";
      if (moveFocus) requestAnimationFrame(() => {
        window.scrollTo({ top: state.scrollY, behavior: "instant" });
        [...document.querySelectorAll("[data-item]")].find((card) => card.dataset.item === state.trigger)?.focus({ preventScroll: true });
      });
      return;
    }
    const item = state.items.find((item) => item.id === id);
    let content = '<p class="calendar-card">' + (state.error ? 'Unable to load this announcement. Select Refresh to try again.' : 'This item is no longer available.') + '</p>';
    if (item) {
      document.title = item.title + " | Byne Christian School";
      const image = safeUrl(item.contentUpload);
      const images = (item.additionalImages || []).map(safeUrl).filter(Boolean);
      const links = [...new Set([item.link, item.additionalLink, ...(item.additionalLinks || [])].map(safeUrl).filter(Boolean))];
      const attachments = images.map((url, index) => external(url, '<img src="' + escape(url) + '" alt="Additional image ' + (index + 1) + '"><span>View full image</span>', "attachment"))
        .concat(links.map((url, index) => external(url, '<span>Open ' + (index === 0 ? 'link' : 'additional link ' + index) + '</span><small>' + escape(new URL(url).hostname) + '</small>', "attachment"))).join("");
      content = '<article class="detail-card' + (image ? ' has-image' : '') + '">' +
        (image ? '<div class="detail-media">' + external(image, '<img src="' + escape(image) + '" alt="' + escape(item.title) + ' artwork">') + '</div>' : '') +
        '<div class="detail-content">' + badges(item) + '<h1 tabindex="-1" data-detail-title>' + escape(item.title) + '</h1>' +
        (item.subtitle ? '<p class="detail-subtitle">' + escape(item.subtitle) + '</p>' : '') +
        '<div class="description">' + escape(item.description) + '</div>' +
        (attachments ? '<section class="attachment-section"><h2>Additional materials</h2><div class="attachment-grid">' + attachments + '</div></section>' : '') + '</div></article>';
    }
    els.detail.innerHTML = '<button type="button" class="back-button" data-back>← Back to ' + (view === "resources" ? "resources" : "announcements") + '</button>' + content;
    if (moveFocus) {
      window.scrollTo({ top: 0, behavior: "instant" });
      els.detail.querySelector("[data-back]").focus();
    }
  }

  function openDetail(id) {
    state.scrollY = window.scrollY;
    state.trigger = id;
    history.pushState({ publicDetail: true }, "", location.pathname + location.search + "#item=" + encodeURIComponent(id));
    showRoute(true);
  }

  function back() {
    if (history.state?.publicDetail) history.back();
    else {
      history.replaceState(null, "", location.pathname + location.search);
      showRoute(true);
    }
  }

  async function refresh() {
    if (state.pending) return;
    state.pending = true;
    els.refresh.disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/.netlify/functions/gradelink-public?view=" + view, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Unable to load");
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Invalid feed");
      state.items = data.items.map((item, index) => ({ ...item, id: item.id || "resource-" + index }));
      state.error = false;
      const selected = els.filter.value;
      const tags = [...new Set(state.items.flatMap((item) => item.tags || []))].sort();
      els.filter.innerHTML = '<option value="">All topics</option>' + tags.map((tag) => '<option value="' + escape(tag) + '">' + escape(tag) + '</option>').join("");
      if (tags.includes(selected)) els.filter.value = selected;
      els.status.textContent = "";
      els.status.parentElement.hidden = true;
    } catch {
      // Never replace a failed live request with old published announcements.
      state.error = true;
      state.items = [];
      els.status.textContent = "Could not refresh current content. Please try again.";
      els.status.parentElement.hidden = false;
    } finally {
      clearTimeout(timeout);
      state.pending = false;
      els.refresh.disabled = false;
      renderOverview();
      showRoute();
    }
  }

  document.querySelectorAll("[data-view]").forEach((link) => {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
  });
  if (calendarLinks[view]) {
    els.featuredSection.hidden = true;
    els.toolbar.hidden = true;
    els.refresh.hidden = true;
    els.status.textContent = "School calendar subscriptions";
    const name = view === "academic" ? "BCS Academic" : "BCS Athletics";
    els.heading.textContent = name + " Calendar";
    els.grid.className = "";
    els.grid.innerHTML = '<article class="calendar-card"><p>Subscribe in your calendar app to receive calendar updates.</p><a href="' + escape(calendarLinks[view]) + '">Open ' + name + ' Calendar</a></article>';
    document.title = name + " Calendar";
    return;
  }
  if (view === "resources") {
    els.featuredSection.hidden = true;
    els.heading.textContent = "Policies & resources";
    els.search.placeholder = "Search resources";
    document.title = "BCS Resources";
  }
  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-item]");
    if (card) openDetail(card.dataset.item);
    if (event.target.closest("[data-back]")) back();
  });
  window.addEventListener("popstate", () => showRoute(true));
  els.search.addEventListener("input", () => { state.limit = 12; renderOverview(); });
  els.filter.addEventListener("change", () => { state.limit = 12; renderOverview(); });
  els.more.addEventListener("click", () => { state.limit += 12; renderOverview(); });
  els.refresh.addEventListener("click", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void refresh(); });
  setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
  void refresh();
})();
