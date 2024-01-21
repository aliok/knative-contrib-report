import {ProcessFileHelper} from "@opentr/cuttlecat/dist/processFileHelper.js";

import {readSlurpJsonFileSync} from "@opentr/cuttlecat/dist/utils.js";
import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function main() {
    const FETCH_REPOS_PROCESS_DIR = join(__dirname, "100-fetch-repos");

    const fetchReposProcessFileHelper = new ProcessFileHelper(FETCH_REPOS_PROCESS_DIR);
    const fetchReposLatestProcessStateDirectory = fetchReposProcessFileHelper.getLatestProcessStateDirectory();
    if (!fetchReposLatestProcessStateDirectory) {
        throw new Error("No latest process state directory found");
    }

    const fetchReposProcessState = fetchReposProcessFileHelper.readProcessStateFile(fetchReposLatestProcessStateDirectory);
    if (fetchReposProcessState == null) {
        throw new Error("Latest process state is null");
    }
    if (fetchReposProcessState.completionDate == null) {
        throw new Error("Latest process state is not complete");
    }

    const repos = [];

    const fetchReposProcessOutputFiles = fetchReposProcessFileHelper.getProcessOutputFiles(fetchReposLatestProcessStateDirectory);
    for (const fetchReposProcessOutputFile of fetchReposProcessOutputFiles) {
        const filePath = join(FETCH_REPOS_PROCESS_DIR, fetchReposLatestProcessStateDirectory, fetchReposProcessOutputFile);
        const fileEntries = readSlurpJsonFileSync(filePath);

        fileEntries.forEach((entry) => {
            for (const repo of entry.result.repositories.nodes) {
                repos.push(`${entry.result.login}/${repo.name}`);
            }
        });
    }

    fs.writeFileSync(join(__dirname, "150-build-repo-list", "repos.json"), JSON.stringify(repos, null, 2));
}

main();
