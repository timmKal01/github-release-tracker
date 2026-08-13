const UA = 'GitHubReleaseTracker/0.1 (+contact: release-tracker-admin@example.com)';
const API_URL = 'https://api.github.com';

export async function fetchReleases({ repo, token, startDate, includePrereleases, limit }) {
    const perPage = Math.min(Math.max(limit * 2, 10), 100);

    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': UA,
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/repos/${repo}/releases?per_page=${perPage}`, { headers });
    if (res.status === 404) throw new Error(`Repo not found: ${repo}`);
    if (res.status === 403) throw new Error(`Rate limited or forbidden for ${repo} (consider providing a githubToken)`);
    if (!res.ok) throw new Error(`GitHub API request failed for ${repo}: ${res.status}`);

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
