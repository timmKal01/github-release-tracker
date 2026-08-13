import { Actor, log } from 'apify';
import { fetchReleases } from './github.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { repos = [], daysBack = 30, includePrereleases = false, maxResultsPerRepo = 10, githubToken } = input;

if (repos.length === 0) {
    throw new Error('No repos provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const REPO_CHECKED_EVENT = 'repo-checked';

const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

for (const repo of repos) {
    let releases;
    try {
        releases = await fetchReleases({
            repo,
            token: githubToken,
            startDate,
            includePrereleases,
            limit: Math.min(maxResultsPerRepo, 50),
        });
    } catch (err) {
        log.warning(`Failed to fetch releases`, { repo, error: err.message });
        continue;
    }

    if (releases.length > 0) {
        await Actor.pushData(releases);
    }
    await Actor.charge({ eventName: REPO_CHECKED_EVENT });

    log.info(`Checked repo`, { repo, releasesFound: releases.length });
}

await Actor.exit();
