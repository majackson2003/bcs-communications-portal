# Release, projections, role checks and recovery

## Scope and ownership

Tier 4 for the staff/authentication boundary. Mark Jackson is the software owner
and production approver. Backup operator, credential-vault entry names, alert
recipients and upstream restore owner remain **unassigned/unverified**; do not
invent them. This runbook does not authorize a release.

The portal is a separate repository/deployment with a Team App-dependent staff
surface, not a Team App database module. Notion Communications Hub is the content
authority; `NOTION_TOKEN` and `NOTION_DATABASE_ID` are server configuration names,
not client values. Planning Center owns calendar events. There is no portal-owned
school database or migration. Integration permission scope must be audited before
claiming the Notion credential itself is read-only; the code only queries it.

## Recorded production baseline (September 24, 2026 EDT)

Revalidate before any release; these are observations, not immutable current truth.

| Item | Evidence |
| --- | --- |
| Default source | `codex/public-communications-portal`, `7f7a13e64b46e9f816a7db02724b164e0235b99a` |
| Source CI | https://github.com/majackson2003/bcs-communications-portal/actions/runs/34367573807 |
| Netlify site | `50cceea6-7f46-4a42-a1fa-98381a9f78df`, `bcs-communications-portal` |
| Domain | `https://bcs-communications-portal.netlify.app`; no custom domain/aliases returned |
| Published artifact | `6aa175032af1fb688e0f6789`, ready, published September 9 15:02:46 UTC |
| Prior rollback artifact | `6aa166121d37bba9f9eb437e`, retained/ready at inspection |
| Provenance limit | Provider `commit_ref` is null. Public JS/CSS byte-match source; HTML has five pretty-URL anchor rewrites. Function binary hash not attested. |

## Projection contracts (descriptive v1; no new API version introduced)

Public announcements: `/.netlify/functions/gradelink-public?view=announcements`.
Notion -> Netlify server projection -> public browser. Public category, valid
Publish Date <= today's New York date, Close Date > today, not archived/trashed.
Newest Last Modified first; ID is tie-breaker. Featured is a subset; the lower
list includes featured and nonfeatured irrespective of legacy Visible checkbox.

Closed fields: `id,title,subtitle,description,contentUpload,additionalImages,
badges,tags,featured,category,publishDate,closeDate,updatedAt,link,additionalLinks`.
No internal notes or arbitrary property passthrough. URLs in this projection must
be HTTP(S). Fetch is paginated at 100 records per request; total cardinality is
not bounded in current source. Client renders 12 lower cards initially, with
Show more; this is not a server data limit. HTTP `no-store`; client refreshes
every 60 seconds while visible and on visibility return. Source failure returns
502, not stale saved announcements; UI clears old items and offers retry.

Public resources: `view=resources`, **Policy category only**, not the announcement
live-date filter. Fields: `id,title,subtitle,description,contentUpload,badges,
category,priority,pinned,link,additionalLink,additionalLinks,additionalImages`.
Sort pinned then numeric priority; pagination has no total cap. Cache 300 seconds
plus 900 seconds stale-while-revalidate. Missing configuration currently yields
an empty resource list; source errors yield502. This differs from announcements.
Policy records must therefore be approved for public display at authoring time.

Public calendars: `view=academic|athletics` reads fixed Planning Center ICS feeds;
returns view/events with parsed title/start and optional end/location/description/url.
The public UI provides calendar subscription links. No portal event writes.

Protected announcements/embed/calendar check a bearer capability with Team App
scope `announcements` or `calendar`; only204 authorizes. Missing/rejected tokens
or broker failure fail closed. Private responses use `private, no-store`.
Staff announcement projection includes category/publish/close/pinned/priority/
featured/visible/link fields and is not the public filtered feed. Legacy protected
embed has its own Visible-based lower-list behavior; do not confuse it with
`gradelink-static.html`. Root200 is a locked shell, not a permission grant.
Its build removes sample fallback content. Browser messaging accepts only the
exact Team App origin and parent window. Public HTML paths deliberately omit
frame-ancestors for Gradelink app views; root retains Team App-only frame ancestry.

## Authorization and failure evidence

| Case | Synthetic harness | Live evidence / remaining check |
| --- | --- | --- |
| Anonymous public/live announcements and Policy reads | projected fields/filter/order | 200:8 announcements,4 featured,10 Policy at baseline; counts change |
| Missing credentials on three protected handlers | denied before source fetch | all401 at baseline |
| Invalid/revoked/wrong-scope credential | simulated broker401/403 denied | invalid token401 observed; real revoked/wrong-scope NOT verified |
| Authorized staff scopes | simulated204 reads allowed for each handler | real staff session + scope isolation NOT verified |
| Broker non-authorizing200 or outage | fail closed, no content fetch | real controlled outage NOT performed |
| Public source failure -> empty recovery |502/no stale records ->200/empty | real provider outage NOT induced |
| Cross-user/cross-school/revocation | not proved by broker simulation | Team App owner must supply dedicated-account matrix |
| UI and embedding | not exercised by handler harness | Mac, physical iPhone Safari/Gradelink, Android Chrome/Gradelink checks pending |

Manual UI acceptance: compact cards; complete uncropped images; full text only on
detail; Back works; bottom and attachments reachable; search keyboard does not
obscure controls; no success/Refresh banner after load; errors remain visible.
Keep public and protected journeys separate. Do not paste real tokens into reports.

## Release procedure (requires explicit named approval)

1. Resolve default HEAD, clean branch and reviewed PR. Preserve unrelated edits.
2. Run `npm test`, `git diff --check`, and verify remote CI at the **final commit**.
   Record full SHA, commands, time, pass/fail counts, and unresolved cells above in
   the PR/checkpoint. Any later edit invalidates affected evidence. A commit cannot
   contain its own final hash; use its CI run and PR evidence as the binding.
3. Verify an isolated preview contains only synthetic content and no production
   credential bindings before hosted rehearsal. This assignment creates no hosted
   preview. Never point a convenient preview at real school data.
4. Obtain Mark's approval naming reviewed SHA and Netlify site ID above before
   merge/deploy. Separate approvals name any Team App auth policy/endpoint change,
   Notion token/database binding, DNS, paid resource, upstream data import/restore,
   or credential rotation. None are authorized by source/test approval.
5. Record current published deploy ID before release; preserve it. Authorized
   operator deploys the exact reviewed commit using the existing Netlify workflow,
   not an unknown working tree. Do not read credentials into terminal output.
6. Capture new artifact ID/domain/time, source provenance and public asset checks;
   repeat public allowed/private denied tests plus approved staff-role checks.
   A CLI artifact with null commit_ref needs explicit source/artifact evidence.
7. Stop on access expansion, missing records, unexplained drift or broken detail
   scrolling. Use approved rollback below; do not improvise a second live change.

## Recovery and worst-case failure

Netlify or Notion failure can stop current parent announcements. Team App outage
denies protected staff content. The read-only portal does not itself delete
upstream records, but restoring a deployment does **not** restore Notion content,
attachments, permissions or Planning Center events. Parent publication may become
stale/unavailable; use a separately approved school communication channel.

Code rollback: authorized Netlify operator confirms site identity and prior ready
artifact, restores that artifact through Netlify's deployment controls, then
checks public reads, protected denials, approved staff access and devices. The
recorded prior ID above is a candidate, not a standing authorization or proof of
an executed rollback. No DNS or secret change is required for code rollback.

Upstream recovery is **not yet proven**. Before a data-affecting release, Mark must
name the backup operator and approve encrypted exports of Notion pages/properties
and attachment bytes plus Planning Center calendars/configuration. Record export
time, stable IDs, counts, checksums, storage/retention/access policy and restore
instructions. Restore into an isolated approved destination (no sends/publication),
verify relationships, attachment accessibility, representative content and source
IDs. Obtain separate approval before production restore or binding changes.
No exports, backups, hosted restore or credential-scope checks were performed here.

Monitoring gap: persistent provider logs, repeated-error alerts, uptime checks,
freshness checks and a second human recipient need owner confirmation. Do not
describe a monitor as active without evidence. Review source/API outages, denied
access and user device reports after release; retain rollback through the agreed
observation window. A backup human and vault-entry references must be supplied
before claiming recovery works when Mark is unavailable. Vendor escalation:
Netlify for deployment/runtime; Notion for content/integration; Planning Center for
calendar feeds; Team App owner for staff access; Gradelink for app embed behavior.

## Publication / send boundary

No email/SMS/push send service exists in the inspected portal path. Editing Notion
Category, publish/close dates or content can automatically expose content publicly;
this is a real publication action even without a Send button. Mark must approve
content/audience/channel/timing for publication or a future messaging activation.
This runbook and harness perform no such action.

## Assignment checkpoint

Source baseline: `7f7a13e64b46e9f816a7db02724b164e0235b99a`.
Scope: this runbook, README, synthetic handler harness only; no runtime/config edits.
Continue-mode role routing: controller/worker kept in one bounded execution to
avoid delegation overhead; no automatic model router claimed. Final SHA and
check results belong in the draft PR. Release decision: **review only**, not
production clearance. Reverting/unmerging these documentation/test files has no
production runtime effect.
