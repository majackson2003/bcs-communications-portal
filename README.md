# BCS Communications Portal

An independently deployed, read-only school communications app. Parents use the
public Gradelink portal; staff views are embedded in Team App and require a
Team App capability. This repository does not author or send announcements.

- Canonical repository: `majackson2003/bcs-communications-portal`
- Default branch: `codex/public-communications-portal`
- Public page: https://bcs-communications-portal.netlify.app/gradelink-static.html
- Runtime: Netlify static assets/functions, Notion content, Planning Center calendars.
- Staff authorization: Team App `https://app.bynesaints.org/api/portal-access`.

## Local verification

Use Node 22. `npm ci` installs the locked development dependencies; `npm test`
runs syntax checks, synthetic tests and the static build. No credentials are
needed. The build replaces only the generated `dist` directory.

For the isolated handler staging harness alone:

```sh
node --test tests/staging-harness.test.js
```

This is **in-process staging**, not a hosted environment or device emulator.
It invokes real handlers but replaces every fetch with fictional responses;
unexpected requests are blocked and fail the suite. No listener, production
credentials, content writes, sending, or deployment is involved. Broker status
simulations do not prove Team App's actual role/revocation implementation.

See [the release and recovery runbook](docs/RELEASE-RUNBOOK.md) for projections,
approval boundaries, evidence requirements and remaining operational gaps.
