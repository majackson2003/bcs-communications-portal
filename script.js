const ITEMS_PER_PAGE = 24;
const ANNOUNCEMENTS_ENDPOINT = "/.netlify/functions/announcements";
const CALENDAR_ENDPOINT = "/.netlify/functions/calendar";
const calendarFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const agendaDateFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

let announcements = [
  {
    title: "Field Day Concessions - Bring cash!",
    subtitle: "Snacks, sweets, and sips for a full day of play",
    contentUpload: "assets/announcements/01-field-day-concessions-bring-cash.jpg",
    badges: ["NEW"],
    tags: ["Activities", "K-6th Grammar"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-16",
    pinned: true,
    priority: 1,
    featured: true,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "House Games at Fun Park - Monday, May 11 | 12:00-2:00 PM",
    subtitle: "A new location, same house pride - join us for an afternoon of competition and fun!",
    contentUpload: "assets/announcements/02-house-games-at-fun-park-monday-may-11-12-00-2-00-pm.jpg",
    badges: ["NEW"],
    tags: ["Activities", "Athletics", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-05-02",
    closeDate: "2026-05-12",
    pinned: true,
    priority: 2,
    featured: true,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Saints in the Summer 2026 T-Shirt Orders Are Open",
    subtitle: "Gear up for summer adventures - and the Pedal, Scoot, & Ride Parade",
    contentUpload: "assets/announcements/03-saints-in-the-summer-2026-t-shirt-orders-are-open.jpg",
    badges: ["NEW"],
    tags: ["Activities", "K-6th Grammar", "Spirit Wear"],
    category: "Public",
    publishDate: "2026-05-03",
    closeDate: "2026-06-01",
    pinned: false,
    priority: 3,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "8th Grade Celebration - Wednesday, May 13 at 8:30 AM",
    subtitle: "Honoring the journey. Looking ahead.",
    contentUpload: "assets/announcements/04-8th-grade-celebration-wednesday-may-13-at-8-30-am.jpg",
    badges: ["NEW"],
    tags: ["Academics", "7-8th Logic"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-14",
    pinned: false,
    priority: 4,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Curtain Up: A Celebration of Broadway - Tuesday, May 12 at 6:30 PM",
    subtitle: "An evening of live Broadway favorites at Byne Church - free and open to the public",
    contentUpload: "assets/announcements/05-curtain-up-a-celebration-of-broadway-tuesday-may-12-at-6-30-pm.jpg",
    badges: ["NEW"],
    tags: ["Activities", "Fine Arts"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-13",
    pinned: false,
    priority: 5,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Cross Country Coach Opening | 2026-2027 School Year",
    subtitle: "Help Us Launch a New Program - Middle & High School",
    contentUpload: "assets/announcements/06-cross-country-coach-opening-2026-2027-school-year.jpg",
    badges: [],
    tags: ["Athletics", "7-8th Logic", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-06-15",
    pinned: false,
    priority: 6,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Keepers of the Kingdom VBS | June 22-25",
    subtitle: "An exciting week of faith, fun, and fellowship for rising 5th grade and under!",
    contentUpload: "assets/announcements/07-keepers-of-the-kingdom-vbs-june-22-25.jpg",
    badges: ["NEW"],
    tags: ["Activities", "K-6th Grammar", "Church"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-06-26",
    pinned: false,
    priority: 7,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Thespian Troupe Service Project | Sleep in Heavenly Peace",
    subtitle: "Don't Miss It - Help Us Serve Our Community",
    contentUpload: "assets/announcements/08-thespian-troupe-service-project-sleep-in-heavenly-peace.jpg",
    badges: [],
    tags: ["Activities", "Fine Arts", "Service"],
    category: "Public",
    publishDate: "2026-04-25",
    closeDate: "2026-05-31",
    pinned: false,
    priority: 8,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Last Day of School | May 15",
    subtitle: "Celebrate the Day - Early Dismissal at 11:30 AM",
    contentUpload: "assets/announcements/09-last-day-of-school-may-15.jpg",
    badges: ["NEW"],
    tags: ["Academics", "K-6th Grammar", "7-8th Logic", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-16",
    pinned: false,
    priority: 9,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Pedal, Scoot & Ride Parade | May 15",
    subtitle: "Kick Off Summer in Style - 10:30 AM Parade | 11:30 AM Early Dismissal",
    contentUpload: "assets/announcements/10-pedal-scoot-ride-parade-may-15.jpg",
    badges: [],
    tags: ["Activities", "K-6th Grammar"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-16",
    pinned: false,
    priority: 10,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Volleyball Camp | May 26-28",
    subtitle: "6th-12th Grade - 9:00 AM-12:00 PM",
    contentUpload: "assets/announcements/11-volleyball-camp-may-26-28.jpg",
    badges: [],
    tags: ["Athletics", "7-8th Logic", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-29",
    pinned: false,
    priority: 11,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Basketball Camp | June 2-4",
    subtitle: "Train Hard - Two Age Groups",
    contentUpload: "assets/announcements/12-basketball-camp-june-2-4.jpg",
    badges: [],
    tags: ["Athletics", "K-6th Grammar", "7-8th Logic"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-06-05",
    pinned: false,
    priority: 12,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Awards Ceremony | May 15",
    subtitle: "You're Invited - 8:30 AM",
    contentUpload: "assets/announcements/13-awards-ceremony-may-15.jpg",
    badges: [],
    tags: ["Academics", "K-6th Grammar", "7-8th Logic", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-16",
    pinned: false,
    priority: 13,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Field Day | May 11 - Rain or Shine! RSVP for lunch",
    subtitle: "A Full Day of Fun, Food, and Friendly Competition",
    contentUpload: "assets/announcements/14-field-day-may-11-rain-or-shine-rsvp-for-lunch.jpg",
    badges: ["UPDATE"],
    tags: ["Activities", "K-6th Grammar", "Athletics"],
    category: "Public",
    publishDate: "2026-04-28",
    closeDate: "2026-05-12",
    pinned: false,
    priority: 14,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Kindergarten Graduation | May 14",
    subtitle: "Don't Miss It - 6:00 PM (Doors Open at 5:30 PM)",
    contentUpload: "assets/announcements/15-kindergarten-graduation-may-14.jpg",
    badges: [],
    tags: ["Academics", "K-6th Grammar"],
    category: "Public",
    publishDate: "2026-05-01",
    closeDate: "2026-05-15",
    pinned: false,
    priority: 15,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Spring 2026 Lunch Menu",
    subtitle: "3/2 through 3/5",
    contentUpload: "",
    badges: [],
    tags: ["Lunch", "K-6th Grammar", "7-8th Logic", "9-12th Rhetoric"],
    category: "Public",
    publishDate: "2026-03-01",
    closeDate: "2026-06-01",
    pinned: false,
    priority: 16,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Domino's Fundraiser Notice",
    subtitle: "Domino's Slice the Price Card Update & Refund Details",
    contentUpload: "assets/announcements/16-domino-s-fundraiser-notice.jpg",
    badges: [],
    tags: ["Activities", "Fundraiser"],
    category: "Public",
    publishDate: "2026-04-15",
    closeDate: "2026-05-31",
    pinned: false,
    priority: 17,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Saints in Camo",
    subtitle: "A New Approved Uniform Favorite from Auti Love",
    contentUpload: "assets/announcements/17-saints-in-camo.jpg",
    badges: [],
    tags: ["Spirit Wear", "Uniforms"],
    category: "Public",
    publishDate: "2026-04-10",
    closeDate: "2026-07-01",
    pinned: false,
    priority: 18,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "School Calendar",
    subtitle: "26/27 Full Year at a Glance",
    contentUpload: "assets/announcements/18-loading.jpg",
    badges: [],
    tags: ["Calendar", "Academics"],
    category: "Public",
    publishDate: "2026-04-01",
    closeDate: "2026-09-01",
    pinned: false,
    priority: 19,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "BCS Families Facebook Group",
    subtitle: "Join Our Online Community",
    contentUpload: "assets/announcements/19-loading.jpg",
    badges: [],
    tags: ["Community", "Parent Resources"],
    category: "Public",
    publishDate: "2026-04-01",
    closeDate: "2026-12-31",
    pinned: false,
    priority: 20,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Summer Office Hours",
    subtitle: "Front office availability for June and July",
    contentUpload: "",
    badges: ["NEW"],
    tags: ["Parent Resources", "Calendar"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-07-31",
    pinned: false,
    priority: 21,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Report Card Pickup",
    subtitle: "Final report cards available in the school office",
    contentUpload: "",
    badges: [],
    tags: ["Academics", "Parent Resources"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-06-15",
    pinned: false,
    priority: 22,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Used Uniform Exchange",
    subtitle: "Bring gently used items and shop for next year's sizes",
    contentUpload: "",
    badges: [],
    tags: ["Uniforms", "Parent Resources"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-06-30",
    pinned: false,
    priority: 23,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Logic School Book Return",
    subtitle: "7th-8th grade families may return school-owned texts after exams",
    contentUpload: "",
    badges: [],
    tags: ["7-8th Logic", "Academics"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-05-22",
    pinned: false,
    priority: 24,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Rhetoric Summer Reading",
    subtitle: "Required reading lists for rising high school students",
    contentUpload: "",
    badges: ["NEW"],
    tags: ["9-12th Rhetoric", "Academics"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-08-10",
    pinned: false,
    priority: 25,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Grammar School Supply Lists",
    subtitle: "Supply lists for rising K3-6th grade students",
    contentUpload: "",
    badges: [],
    tags: ["K-6th Grammar", "Academics"],
    category: "Public",
    publishDate: "2026-05-04",
    closeDate: "2026-08-10",
    pinned: false,
    priority: 26,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
  {
    title: "Expired Spring Break Notice",
    subtitle: "This expired record demonstrates close-date filtering.",
    contentUpload: "",
    badges: [],
    tags: ["Calendar"],
    category: "Public",
    publishDate: "2026-03-01",
    closeDate: "2026-04-01",
    pinned: false,
    priority: 99,
    featured: false,
    visible: true,
    link: "",
    additionalLink: "",
  },
];

const state = {
  activePage: "announcements",
  collections: {
    announcements: {
      search: "",
      tag: "",
      visibleCount: ITEMS_PER_PAGE,
    },
    resources: {
      search: "",
      tag: "",
      visibleCount: ITEMS_PER_PAGE,
    },
  },
  calendars: {
    athletics: {
      currentDate: new Date(),
      events: [],
      loaded: false,
      loading: false,
    },
    academic: {
      currentDate: new Date(),
      events: [],
      loaded: false,
      loading: false,
    },
  },
  lastFocusedElement: null,
  detailReturnPage: "announcements",
  detailReturnScrollY: 0,
};

const elements = {
  pages: document.querySelectorAll("[data-page]"),
  pageLinks: document.querySelectorAll("[data-page-link]"),
  featuredGrid: document.querySelector("[data-featured-grid]"),
  featuredEmpty: document.querySelector("[data-featured-empty]"),
  announcementGrid: document.querySelector("[data-announcement-grid]"),
  announcementEmpty: document.querySelector("[data-announcement-empty]"),
  search: document.querySelector("[data-search]"),
  tagFilter: document.querySelector("[data-tag-filter]"),
  loadMore: document.querySelector("[data-load-more]"),
  resultsMeta: document.querySelector("[data-results-meta]"),
  resourcesRecentGrid: document.querySelector("[data-resources-recent-grid]"),
  resourcesRecentEmpty: document.querySelector("[data-resources-recent-empty]"),
  resourcesGrid: document.querySelector("[data-resources-grid]"),
  resourcesEmpty: document.querySelector("[data-resources-empty]"),
  resourcesSearch: document.querySelector("[data-resources-search]"),
  resourcesTagFilter: document.querySelector("[data-resources-tag-filter]"),
  resourcesLoadMore: document.querySelector("[data-resources-load-more]"),
  resourcesResultsMeta: document.querySelector("[data-resources-results-meta]"),
  calendarLabels: document.querySelectorAll("[data-calendar-label]"),
  calendarGrids: document.querySelectorAll("[data-calendar-grid]"),
  calendarLists: document.querySelectorAll("[data-calendar-list]"),
  calendarStatuses: document.querySelectorAll("[data-calendar-status]"),
  calendarPrevButtons: document.querySelectorAll("[data-calendar-prev]"),
  calendarNextButtons: document.querySelectorAll("[data-calendar-next]"),
  modalShell: document.querySelector("[data-modal-shell]"),
  modalBadges: document.querySelector("[data-modal-badges]"),
  modalTitle: document.querySelector("[data-modal-title]"),
  modalSubtitle: document.querySelector("[data-modal-subtitle]"),
  modalDescriptionBlock: document.querySelector("[data-modal-description-block]"),
  modalDescription: document.querySelector("[data-modal-description]"),
  modalMedia: document.querySelector("[data-modal-media]"),
  modalAttachments: document.querySelector("[data-modal-attachments]"),
  modalAttachmentGrid: document.querySelector("[data-modal-attachment-grid]"),
  modalCloseButton: document.querySelector(".modal-close"),
  modalCloseControls: document.querySelectorAll("[data-modal-close]"),
  mediaPreviewShell: document.querySelector("[data-media-preview-shell]"),
  mediaPreviewImage: document.querySelector("[data-media-preview-image]"),
  mediaPreviewTitle: document.querySelector("[data-media-preview-title]"),
  mediaPreviewCloseControls: document.querySelectorAll("[data-media-preview-close]"),
  announcementDetail: document.querySelector("[data-announcement-detail]"),
  announcementBack: document.querySelector("[data-announcement-back]"),
  detailBadges: document.querySelector("[data-detail-badges]"),
  detailTitle: document.querySelector("[data-detail-title]"),
  detailSubtitle: document.querySelector("[data-detail-subtitle]"),
  detailDescriptionBlock: document.querySelector("[data-detail-description-block]"),
  detailDescription: document.querySelector("[data-detail-description]"),
  detailMedia: document.querySelector("[data-detail-media]"),
  detailAttachments: document.querySelector("[data-detail-attachments]"),
  detailAttachmentGrid: document.querySelector("[data-detail-attachment-grid]"),
};

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

function calendarElement(collection, selector) {
  return document.querySelector(`[${selector}="${collection}"]`);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseEventDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  return new Date(value);
}

function formatEventTime(event) {
  if (!event.start || /^\d{4}-\d{2}-\d{2}$/.test(event.start)) return "All day";
  const start = parseEventDate(event.start);
  if (!start || Number.isNaN(start.getTime())) return "";
  return timeFormat.format(start);
}

const collectionConfig = {
  announcements: {
    category: "Public",
    emptyPrefix: "announcements",
    recentLimit: null,
    requireCurrentDates: true,
    requireVisible: true,
  },
  resources: {
    category: "Policy",
    emptyPrefix: "resources",
    recentLimit: 4,
    requireCurrentDates: false,
    requireVisible: false,
  },
};

function isCollectionItem(item, collection) {
  const config = collectionConfig[collection];
  const today = todayAtMidnight();
  const isCurrent =
    !config.requireCurrentDates ||
    (parseDate(item.publishDate) <= today && parseDate(item.closeDate) > today);
  const isVisible = !config.requireVisible || isNonEmpty(item.visible);

  return (
    item.category === config.category &&
    isCurrent &&
    isVisible
  );
}

function compareAnnouncements(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.priority - b.priority;
}

function getCollectionState(collection) {
  return state.collections[collection];
}

function getBaseItems(collection) {
  return announcements
    .filter((item) => isCollectionItem(item, collection))
    .sort(compareAnnouncements);
}

function getRecentItems(collection) {
  const featured = announcements
    .filter((item) => isCollectionItem(item, collection) && isNonEmpty(item.featured))
    .sort(compareAnnouncements);

  const config = collectionConfig[collection];
  if (featured.length || !config.recentLimit) return featured;
  return getBaseItems(collection).slice(0, config.recentLimit);
}

function collectSearchText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(collectSearchText).join(" ");
  if (typeof value === "object") return Object.values(value).map(collectSearchText).join(" ");
  return String(value);
}

function matchesSearch(item, collection) {
  const { search } = getCollectionState(collection);
  if (!search) return true;
  const searchable = collectSearchText(item).toLowerCase();
  return searchable.includes(search);
}

function matchesTag(item, collection) {
  const { tag } = getCollectionState(collection);
  return !tag || item.tags.includes(tag);
}

function getFilteredItems(collection) {
  return getBaseItems(collection).filter((item) => matchesSearch(item, collection) && matchesTag(item, collection));
}

function uniqueSortedTags(collection) {
  return [...new Set(getBaseItems(collection).flatMap((item) => item.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function cardTemplate(item) {
  const index = announcements.indexOf(item);
  const badges = item.badges
    .map((badge) => `<span class="badge ${escapeHTML(badge.toLowerCase())}">${escapeHTML(badge)}</span>`)
    .join("");
  const media = item.contentUpload
    ? `<img src="${escapeHTML(item.contentUpload)}" alt="${escapeHTML(item.title)} flyer" loading="lazy">`
    : `<span class="media-placeholder" aria-label="No image available">${imageIcon()}</span>`;

  return `
    <button class="card" type="button" data-announcement-card="${index}" aria-label="Open ${escapeHTML(item.title)}">
      <span class="media-wrap">
        ${media}
        ${badges ? `<span class="badge-list">${badges}</span>` : ""}
      </span>
      <span class="card-body">
        <span class="card-title">${escapeHTML(item.title)}</span>
        <span class="card-subtitle">${escapeHTML(item.subtitle)}</span>
      </span>
    </button>
  `;
}

function imageIcon() {
  return `
    <svg viewBox="0 0 24 24" role="img">
      <rect x="3" y="4" width="18" height="16" rx="3"></rect>
      <circle cx="8.5" cy="9" r="1.8"></circle>
      <path d="m21 15-4.5-4.5L7 20"></path>
    </svg>
  `;
}

function renderRecent(collection, gridElement, emptyElement) {
  const items = getRecentItems(collection);
  gridElement.innerHTML = items.map(cardTemplate).join("");
  gridElement.classList.toggle("is-hidden", items.length === 0);
  emptyElement.classList.toggle("is-hidden", items.length > 0);
}

function renderTagOptions(collection, selectElement) {
  const currentValue = getCollectionState(collection).tag;
  const options = uniqueSortedTags(collection)
    .map((tag) => `<option value="${escapeHTML(tag)}">${escapeHTML(tag)}</option>`)
    .join("");
  selectElement.innerHTML = `<option value="">Filter</option>${options}`;
  selectElement.value = currentValue;
}

function renderCollection(collection, gridElement, emptyElement, loadMoreElement, resultsMetaElement) {
  const filtered = getFilteredItems(collection);
  const { visibleCount } = getCollectionState(collection);
  const visibleItems = filtered.slice(0, visibleCount);
  const hasResults = filtered.length > 0;
  const label = collectionConfig[collection].emptyPrefix;

  gridElement.innerHTML = visibleItems.map(cardTemplate).join("");
  gridElement.classList.toggle("is-hidden", !hasResults);
  emptyElement.classList.toggle("is-hidden", hasResults);
  loadMoreElement.classList.toggle("is-hidden", visibleItems.length >= filtered.length);

  if (hasResults) {
    resultsMetaElement.textContent = `Showing ${visibleItems.length} of ${filtered.length} ${label}`;
  } else {
    resultsMetaElement.textContent = "";
  }
}

function badgeTemplate(badge) {
  return `<span class="badge ${escapeHTML(badge.toLowerCase())}">${escapeHTML(badge)}</span>`;
}

function linkTemplate(url, label) {
  if (!url) return "";
  return `<a class="modal-link attachment-link" href="${escapeHTML(url)}" target="_blank" rel="noreferrer"><span class="attachment-link-icon" aria-hidden="true">↗</span><span>${escapeHTML(label)}</span><strong>${escapeHTML(url)}</strong></a>`;
}

function imageThumbnailTemplate(url, title, index) {
  return `<button class="attachment-thumbnail" type="button" data-media-preview-url="${escapeHTML(url)}" data-media-preview-title="${escapeHTML(title)} — image ${index + 1}" aria-label="Open full-size ${escapeHTML(title)} image ${index + 1}"><img src="${escapeHTML(url)}" alt="${escapeHTML(title)} additional image ${index + 1}" loading="lazy"><span>View image</span></button>`;
}

function setModalTextField(element, value) {
  const text = value?.trim() || "";
  element.textContent = text;
  element.classList.toggle("is-hidden", !text);
  return Boolean(text);
}

function openModal(item, trigger) {
  state.lastFocusedElement = trigger;
  elements.modalBadges.innerHTML = item.badges?.length ? item.badges.map(badgeTemplate).join("") : "";
  setModalTextField(elements.modalTitle, item.title);
  setModalTextField(elements.modalSubtitle, item.subtitle);
  const hasDescription = setModalTextField(elements.modalDescription, item.description);
  elements.modalDescriptionBlock.classList.toggle("is-hidden", !hasDescription);
  elements.modalMedia.innerHTML = item.contentUpload
    ? `<img src="${escapeHTML(item.contentUpload)}" alt="${escapeHTML(item.title || "Announcement")} artwork">`
    : "";
  elements.modalMedia.classList.toggle("is-hidden", !item.contentUpload);
  const additionalImages = Array.isArray(item.additionalImages) ? item.additionalImages : [];
  elements.modalAttachmentGrid.innerHTML = [
    ...additionalImages.map((url, index) => imageThumbnailTemplate(url, item.title || "Announcement", index)),
    linkTemplate(item.link, "Link"),
    linkTemplate(item.additionalLink, "Additional link"),
  ].join("");
  elements.modalAttachments.classList.toggle("is-hidden", !additionalImages.length && !item.link && !item.additionalLink);
  elements.modalShell.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  elements.modalCloseButton?.focus();
}

function openAnnouncementDetail(item, trigger) {
  state.lastFocusedElement = trigger;
  state.detailReturnPage = state.activePage;
  state.detailReturnScrollY = window.scrollY;
  elements.detailBadges.innerHTML = item.badges?.length ? item.badges.map(badgeTemplate).join("") : "";
  setModalTextField(elements.detailTitle, item.title);
  setModalTextField(elements.detailSubtitle, item.subtitle);
  const hasDescription = setModalTextField(elements.detailDescription, item.description);
  elements.detailDescriptionBlock.classList.toggle("is-hidden", !hasDescription);
  elements.detailMedia.innerHTML = item.contentUpload
    ? `<img src="${escapeHTML(item.contentUpload)}" alt="${escapeHTML(item.title || "Announcement")} artwork">`
    : "";
  elements.detailMedia.classList.toggle("is-hidden", !item.contentUpload);
  const additionalImages = Array.isArray(item.additionalImages) ? item.additionalImages : [];
  elements.detailAttachmentGrid.innerHTML = [
    ...additionalImages.map((url, index) => imageThumbnailTemplate(url, item.title || "Announcement", index)),
    linkTemplate(item.link, "Link"),
    linkTemplate(item.additionalLink, "Additional link"),
  ].join("");
  elements.detailAttachments.classList.toggle("is-hidden", !additionalImages.length && !item.link && !item.additionalLink);
  elements.pages.forEach((pageElement) => pageElement.classList.add("is-hidden"));
  elements.announcementDetail.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "instant" });
  elements.announcementBack.focus();
}

function closeAnnouncementDetail() {
  elements.announcementDetail.classList.add("is-hidden");
  setActivePage(state.detailReturnPage);
  window.scrollTo({ top: state.detailReturnScrollY, behavior: "instant" });
  state.lastFocusedElement?.focus();
}

function closeModal() {
  elements.modalShell.classList.add("is-hidden");
  document.body.classList.remove("modal-open");
  state.lastFocusedElement?.focus();
}

function openMediaPreview(url, title, trigger) {
  state.lastPreviewTrigger = trigger;
  elements.mediaPreviewImage.src = url;
  elements.mediaPreviewImage.alt = title;
  elements.mediaPreviewTitle.textContent = title;
  elements.mediaPreviewShell.classList.remove("is-hidden");
  elements.mediaPreviewCloseControls[0]?.focus();
}

function closeMediaPreview() {
  elements.mediaPreviewShell.classList.add("is-hidden");
  elements.mediaPreviewImage.removeAttribute("src");
  state.lastPreviewTrigger?.focus();
}

function handleCardClick(event) {
  const card = event.target.closest("[data-announcement-card]");
  if (!card) return;
  const item = announcements[Number(card.dataset.announcementCard)];
  if (item) openAnnouncementDetail(item, card);
}

function resetVisibleCount(collection) {
  getCollectionState(collection).visibleCount = ITEMS_PER_PAGE;
}

elements.search.addEventListener("input", (event) => {
  state.collections.announcements.search = event.target.value.trim().toLowerCase();
  resetVisibleCount("announcements");
  renderAnnouncementsPage();
});

elements.tagFilter.addEventListener("change", (event) => {
  state.collections.announcements.tag = event.target.value;
  resetVisibleCount("announcements");
  renderAnnouncementsPage();
});

elements.loadMore.addEventListener("click", () => {
  state.collections.announcements.visibleCount += ITEMS_PER_PAGE;
  renderAnnouncementsPage();
});

elements.resourcesSearch.addEventListener("input", (event) => {
  state.collections.resources.search = event.target.value.trim().toLowerCase();
  resetVisibleCount("resources");
  renderResourcesPage();
});

elements.resourcesTagFilter.addEventListener("change", (event) => {
  state.collections.resources.tag = event.target.value;
  resetVisibleCount("resources");
  renderResourcesPage();
});

elements.resourcesLoadMore.addEventListener("click", () => {
  state.collections.resources.visibleCount += ITEMS_PER_PAGE;
  renderResourcesPage();
});

elements.featuredGrid.addEventListener("click", handleCardClick);
elements.announcementGrid.addEventListener("click", handleCardClick);
elements.resourcesRecentGrid.addEventListener("click", handleCardClick);
elements.resourcesGrid.addEventListener("click", handleCardClick);

elements.calendarPrevButtons.forEach((button) => {
  button.addEventListener("click", () => changeCalendarMonth(button.dataset.calendarPrev, -1));
});

elements.calendarNextButtons.forEach((button) => {
  button.addEventListener("click", () => changeCalendarMonth(button.dataset.calendarNext, 1));
});

elements.calendarGrids.forEach((grid) => {
  grid.addEventListener("click", handleCalendarEventClick);
});

elements.calendarLists.forEach((list) => {
  list.addEventListener("click", handleCalendarEventClick);
});

elements.pageLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setActivePage(link.dataset.pageLink);
  });
});

elements.modalCloseControls.forEach((control) => {
  control.addEventListener("click", closeModal);
});

elements.announcementBack.addEventListener("click", closeAnnouncementDetail);

elements.mediaPreviewCloseControls.forEach((control) => {
  control.addEventListener("click", closeMediaPreview);
});

document.addEventListener("click", (event) => {
  const thumbnail = event.target.closest("[data-media-preview-url]");
  if (thumbnail) openMediaPreview(thumbnail.dataset.mediaPreviewUrl, thumbnail.dataset.mediaPreviewTitle, thumbnail);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modalShell.classList.contains("is-hidden")) {
    if (!elements.mediaPreviewShell.classList.contains("is-hidden")) closeMediaPreview();
    else closeModal();
  }
});

window.addEventListener("hashchange", () => {
  setActivePage(window.location.hash.slice(1));
});

function renderAnnouncementsPage() {
  renderTagOptions("announcements", elements.tagFilter);
  renderRecent("announcements", elements.featuredGrid, elements.featuredEmpty);
  renderCollection(
    "announcements",
    elements.announcementGrid,
    elements.announcementEmpty,
    elements.loadMore,
    elements.resultsMeta,
  );
}

function renderResourcesPage() {
  renderTagOptions("resources", elements.resourcesTagFilter);
  renderRecent("resources", elements.resourcesRecentGrid, elements.resourcesRecentEmpty);
  renderCollection(
    "resources",
    elements.resourcesGrid,
    elements.resourcesEmpty,
    elements.resourcesLoadMore,
    elements.resourcesResultsMeta,
  );
}

function renderPortal() {
  renderAnnouncementsPage();
  renderResourcesPage();
}

function setActivePage(page) {
  const nextPage = document.querySelector(`[data-page="${page}"]`) ? page : "announcements";
  state.activePage = nextPage;
  elements.announcementDetail.classList.add("is-hidden");

  elements.pages.forEach((pageElement) => {
    pageElement.classList.toggle("is-hidden", pageElement.dataset.page !== nextPage);
  });

  elements.pageLinks.forEach((link) => {
    const isCurrent = link.dataset.pageLink === nextPage;
    link.setAttribute("aria-current", isCurrent ? "page" : "false");
  });

  if (nextPage === "athletics-calendar") loadCalendar("athletics");
  if (nextPage === "academic-calendar") loadCalendar("academic");
}

function eventsForDay(events, date) {
  const key = localDateKey(date);
  return events.filter((event) => event.startDate === key);
}

function monthEvents(collection) {
  const calendar = state.calendars[collection];
  const start = monthStart(calendar.currentDate);
  const end = addMonths(start, 1);
  return calendar.events.filter((event) => {
    const eventDate = parseEventDate(event.startDate);
    return eventDate && eventDate >= start && eventDate < end;
  });
}

function setInitialCalendarMonth(collection) {
  const calendar = state.calendars[collection];
  if (monthEvents(collection).length || !calendar.events.length) return;

  const today = todayAtMidnight();
  const firstUpcoming = calendar.events.find((event) => {
    const eventDate = parseEventDate(event.startDate);
    return eventDate && eventDate >= today;
  });
  const fallback = calendar.events[0];
  const targetDate = parseEventDate(firstUpcoming?.startDate || fallback?.startDate);

  if (targetDate && !Number.isNaN(targetDate.getTime())) {
    calendar.currentDate = monthStart(targetDate);
  }
}

function calendarEventTemplate(event, collection) {
  const index = state.calendars[collection].events.indexOf(event);
  return `
    <button class="calendar-event" type="button" data-calendar-event="${collection}" data-calendar-event-index="${index}">
      <strong>${escapeHTML(event.title)}</strong>
      <span>${escapeHTML(formatEventTime(event))}${event.location ? ` · ${escapeHTML(event.location)}` : ""}</span>
    </button>
  `;
}

function renderCalendarGrid(collection) {
  const calendar = state.calendars[collection];
  const labelElement = calendarElement(collection, "data-calendar-label");
  const gridElement = calendarElement(collection, "data-calendar-grid");
  if (!labelElement || !gridElement) return;

  const firstOfMonth = monthStart(calendar.currentDate);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());
  labelElement.textContent = calendarFormat.format(firstOfMonth);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div class="calendar-weekday">${day}</div>`)
    .join("");
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const inMonth = date.getMonth() === firstOfMonth.getMonth();
    const dayEvents = eventsForDay(calendar.events, date);

    days.push(`
      <div class="calendar-day${inMonth ? "" : " muted"}${dayEvents.length ? " has-events" : ""}">
        <span class="calendar-day-number">${date.getDate()}</span>
        <div class="calendar-day-events">
          ${dayEvents.slice(0, 3).map((event) => calendarEventTemplate(event, collection)).join("")}
          ${dayEvents.length > 3 ? `<span class="calendar-more">+${dayEvents.length - 3} more</span>` : ""}
        </div>
      </div>
    `);
  }

  gridElement.innerHTML = `<div class="calendar-grid">${weekdays}${days.join("")}</div>`;
}

function renderCalendarList(collection) {
  const listElement = calendarElement(collection, "data-calendar-list");
  if (!listElement) return;

  const events = monthEvents(collection);
  if (!events.length) {
    listElement.innerHTML = `<div class="calendar-list-empty">No events this month.</div>`;
    return;
  }

  listElement.innerHTML = events
    .map((event) => {
      const eventDate = parseEventDate(event.startDate);
      const dateLabel = eventDate && !Number.isNaN(eventDate.getTime()) ? agendaDateFormat.format(eventDate) : "";
      return `
        <article class="calendar-list-item">
          <time>${escapeHTML(dateLabel)}</time>
          <button type="button" data-calendar-event="${collection}" data-calendar-event-index="${state.calendars[collection].events.indexOf(event)}">
            <h3>${escapeHTML(event.title)}</h3>
            <p>${escapeHTML(formatEventTime(event))}${event.location ? ` · ${escapeHTML(event.location)}` : ""}</p>
          </button>
        </article>
      `;
    })
    .join("");
}

function renderCalendar(collection) {
  const statusElement = calendarElement(collection, "data-calendar-status");
  const calendar = state.calendars[collection];
  renderCalendarGrid(collection);
  renderCalendarList(collection);

  if (statusElement) {
    const count = monthEvents(collection).length;
    statusElement.textContent = calendar.loaded ? `${count} events this month` : "Loading calendar...";
  }
}

async function loadCalendar(collection) {
  const calendar = state.calendars[collection];
  if (calendar.loaded || calendar.loading) {
    renderCalendar(collection);
    return;
  }

  calendar.loading = true;
  renderCalendar(collection);

  try {
    const response = await fetch(`${CALENDAR_ENDPOINT}?type=${collection}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`);
    const payload = await response.json();
    calendar.events = Array.isArray(payload.events) ? payload.events : [];
    calendar.loaded = true;
    setInitialCalendarMonth(collection);
  } catch (error) {
    const statusElement = calendarElement(collection, "data-calendar-status");
    if (statusElement) statusElement.textContent = "Unable to load this calendar right now.";
    console.error(error);
  } finally {
    calendar.loading = false;
    renderCalendar(collection);
  }
}

function changeCalendarMonth(collection, delta) {
  state.calendars[collection].currentDate = addMonths(state.calendars[collection].currentDate, delta);
  renderCalendar(collection);
  loadCalendar(collection);
}

function openCalendarEventModal(event, trigger) {
  const details = [formatEventTime(event), event.location].filter(Boolean).join(" · ");
  openModal(
    {
      title: event.title,
      subtitle: details,
      description: event.description || "",
      contentUpload: "",
      badges: ["Calendar"],
      link: event.url || "",
      additionalLink: "",
    },
    trigger,
  );
}

function handleCalendarEventClick(event) {
  const eventButton = event.target.closest("[data-calendar-event]");
  if (!eventButton) return;

  const collection = eventButton.dataset.calendarEvent;
  const calendarEvent = state.calendars[collection]?.events[Number(eventButton.dataset.calendarEventIndex)];
  if (calendarEvent) openCalendarEventModal(calendarEvent, eventButton);
}

function normalizeAnnouncement(item) {
  return {
    title: item.title || "",
    subtitle: item.subtitle || "",
    description: item.description || "",
    contentUpload: item.contentUpload || "",
    additionalImages: Array.isArray(item.additionalImages) ? item.additionalImages : [],
    badges: Array.isArray(item.badges) ? item.badges : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    category: item.category || "",
    publishDate: item.publishDate || "",
    closeDate: item.closeDate || "",
    pinned: Boolean(item.pinned),
    priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 999,
    featured: item.featured || false,
    visible: item.visible || false,
    link: item.link || "",
    additionalLink: item.additionalLink || "",
  };
}

async function loadLiveAnnouncements() {
  try {
    const response = await fetch(ANNOUNCEMENTS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;

    const data = await response.json();
    if (!Array.isArray(data.announcements) || data.announcements.length === 0) return;

    announcements = data.announcements.map(normalizeAnnouncement);
  } catch (error) {
    console.info("Using local announcement fallback data.", error);
  }
}

async function initializePortal() {
  setActivePage(window.location.hash.slice(1) || "announcements");
  renderPortal();
  await loadLiveAnnouncements();
  resetVisibleCount("announcements");
  resetVisibleCount("resources");
  renderPortal();
}

initializePortal();
