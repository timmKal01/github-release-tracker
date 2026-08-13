# GitHub Release Tracker — New Versions & Changelogs

Track new releases for the GitHub repos you depend on. Get the version
tag, release name, changelog body, publish date, and release URL the
moment a new one ships — without checking each repo's Releases page by
hand.

Built for engineering teams monitoring critical dependencies and security
teams watching upstream projects for patch releases.

## Input

```json
{
  "repos": ["facebook/react", "nodejs/node"],
  "daysBack": 30,
  "includePrereleases": false,
  "maxResultsPerRepo": 10
}
```

| Field | Type | Description |
|---|---|---|
| `repos` | array of strings | Repos to check, as `"owner/repo"`. One release lookup is billed per repo. |
| `daysBack` | number | Only return releases published within this many days of today. Default `30`, max `365`. |
| `includePrereleases` | boolean | Include betas/release candidates in addition to stable releases. Default `false`. |
| `maxResultsPerRepo` | number | Max releases to return per repo, most recent first. Default `10`, max `50`. |
| `githubToken` | string (optional) | A personal access token, kept secret. Not required for public repos — raises GitHub's unauthenticated rate limit (60 requests/hour) to 5,000/hour if you're checking many repos in one run. |

## Output

One record per release:

```json
{
  "repo": "facebook/react",
  "tagName": "v19.1.0",
  "name": "19.1.0",
  "publishedAt": "2026-07-14T18:22:03Z",
  "isPrerelease": false,
  "htmlUrl": "https://github.com/facebook/react/releases/tag/v19.1.0",
  "author": "gaearon",
  "body": "## What's Changed\n- ..."
}
```

A repo with no releases in the requested window returns no items but is
still billed once for the lookup.

## How it works

Direct calls to the official [GitHub REST API](https://docs.github.com/en/rest/releases/releases)
(`api.github.com`). No proxy, no scraping — public repo data only.

## Pricing note

Billed per **repo checked**, not per release returned — one charge per
repo whether it has 0 or 50 matching releases.

## Related products

- [Company Hiring Tracker](https://github.com/timmKal01/company-hiring-tracker) — same per-item pattern, for job board openings instead of releases
- [Vulnerability Alert](https://github.com/timmKal01/vulnerability-alert) — new CVEs by product, if you're watching for security issues rather than version bumps
