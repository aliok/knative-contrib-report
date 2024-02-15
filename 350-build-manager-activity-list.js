import {ProcessFileHelper} from "@opentr/cuttlecat/dist/processFileHelper.js";

import {readSlurpJsonFileSync} from "@opentr/cuttlecat/dist/utils.js";
import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function main() {
    const FETCH_MANAGER_ACTIVITIES_PROCESS_DIR = join(__dirname, "310-fetch-manager-activities");

    const fetchManagerActivitiesProcessFileHelper = new ProcessFileHelper(FETCH_MANAGER_ACTIVITIES_PROCESS_DIR);
    const fetchManagerActivitiesLatestProcessStateDirectory = fetchManagerActivitiesProcessFileHelper.getLatestProcessStateDirectory();
    if (!fetchManagerActivitiesLatestProcessStateDirectory) {
        throw new Error("No latest process state directory found");
    }

    const fetchManagerActivitiesProcessState = fetchManagerActivitiesProcessFileHelper.readProcessStateFile(fetchManagerActivitiesLatestProcessStateDirectory);
    if (fetchManagerActivitiesProcessState == null) {
        throw new Error("Latest process state is null");
    }
    if (fetchManagerActivitiesProcessState.completionDate == null) {
        throw new Error("Latest process state is not complete");
    }

    const managers = {};

    const fetchManagerActivitiesProcessOutputFiles = fetchManagerActivitiesProcessFileHelper.getProcessOutputFiles(fetchManagerActivitiesLatestProcessStateDirectory);
    for (const outputFile of fetchManagerActivitiesProcessOutputFiles) {
        const filePath = join(FETCH_MANAGER_ACTIVITIES_PROCESS_DIR, fetchManagerActivitiesLatestProcessStateDirectory, outputFile);
        const fileEntries = readSlurpJsonFileSync(filePath);

        fileEntries.forEach((entry) => {
            const user = entry.result.login;

            if(managers[user] === undefined) {
                managers[user] = {
                    login: entry.result.login,
                    name: entry.result.name,
                    hasAnyContributions: false,
                    totalCommitContributions: 0,
                    totalIssueContributions: 0,
                    totalPullRequestContributions: 0,
                    totalPullRequestReviewContributions: 0,
                    contributedRepositories: [],
                };
            }

            const contribs = [];

            contribs.push(...entry.result.contributionsCollection.commitContributionsByRepository);
            contribs.push(...entry.result.contributionsCollection.issueContributionsByRepository);
            contribs.push(...entry.result.contributionsCollection.pullRequestContributionsByRepository);
            contribs.push(...entry.result.contributionsCollection.pullRequestReviewContributionsByRepository);

            for (const contrib of contribs) {
                const repo = contrib.repository.nameWithOwner;
                if (!managers[user].contributedRepositories.includes(repo)) {
                    managers[user].contributedRepositories.push(repo);
                }
            }

            managers[user].totalCommitContributions += entry.result.contributionsCollection.totalCommitContributions;
            managers[user].totalIssueContributions += entry.result.contributionsCollection.totalIssueContributions;
            managers[user].totalPullRequestContributions += entry.result.contributionsCollection.totalPullRequestContributions;
            managers[user].totalPullRequestReviewContributions += entry.result.contributionsCollection.totalPullRequestReviewContributions;

        });

        for (const user in managers) {
            if (managers[user].contributedRepositories.length > 0) {
                managers[user].hasAnyContributions = true;
            }
        }
    }

    fs.writeFileSync(join(__dirname, "350-build-manager-activity-list", "manager-activities.json"), JSON.stringify(managers, null, 2));

    const managersWithoutContributions = Object.values(managers).filter((manager) => !manager.hasAnyContributions);
    fs.writeFileSync(join(__dirname, "350-build-manager-activity-list", "managers-without-contributions.json"), JSON.stringify(managersWithoutContributions, null, 2));
}

main();
