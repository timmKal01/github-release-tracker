const UA = 'GitHubReleaseTracker/0.1 (+contact: release-tracker-admin@example.com)';
const API_URL = 'https://api.github.com';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.status === 404 || res.status === 403 || res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

export async function fetchReleases({ repo, token, startDate, includePrereleases, limit }) {
    const perPage = Math.min(Math.max(limit * 2, 10), 100);

    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': UA,
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetchWithRetry(`${API_URL}/repos/${repo}/releases?per_page=${perPage}`, { headers });
    if (res.status === 404) throw new Error(`Repo not found: ${repo}`);
    if (res.status === 403) throw new Error(`Rate limited or forbidden for ${repo} (consider providing a githubToken)`);

    const releases = await res.json();

    return releases
        .filter((r) => !r.draft)
        .filter((r) => includePrereleases || !r.prerelease)
        .filter((r) => r.published_at && new Date(r.published_at) >= startDate)
        .slice(0, limit)
        .map((r) => ({
            repo,
            tagName: r.tag_name,
            name: r.name || r.tag_name,
            publishedAt: r.published_at,
            isPrerelease: r.prerelease,
            htmlUrl: r.html_url,
            author: r.author?.login ?? null,
            body: r.body ? (r.body.length > 3000 ? `${r.body.slice(0, 3000)}…` : r.body) : null,
        }));
}
