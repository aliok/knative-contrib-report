import {ProcessFileHelper} from "@opentr/cuttlecat/dist/processFileHelper.js";

import {readSlurpJsonFileSync} from "@opentr/cuttlecat/dist/utils.js";
import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function main() {
    const FETCH_COMMITS_PROCESS_DIR = join(__dirname, "200-fetch-commits");

    // map of contritor to earliest commit date
    const contributorMap = {};

    const fetchCommitsProcessFileHelper = new ProcessFileHelper(FETCH_COMMITS_PROCESS_DIR);
    const commitDirs = fetchCommitsProcessFileHelper.getProcessStateDirectories();
    for (const commitDir of commitDirs) {
        const fetchCommitsProcessState = fetchCommitsProcessFileHelper.readProcessStateFile(commitDir);
        if (fetchCommitsProcessState == null) {
            console.log(`Process state is null: ${commitDir}`);
            continue;
        }
        // TODO
        // if (fetchCommitsProcessState.completionDate == null) {
        //     console.log(`Process state is not complete: ${commitDir}`);
        //     continue;
        // }

        const outputFiles = fetchCommitsProcessFileHelper.getProcessOutputFiles(commitDir);
        for (const outputFile of outputFiles) {
            const filePath = join(FETCH_COMMITS_PROCESS_DIR, commitDir, outputFile);
            const fileEntries = readSlurpJsonFileSync(filePath);
            for(const entry of fileEntries){
                for(const commit of entry.result.defaultBranchRef.target.history.nodes){
                    const repo = entry.result.nameWithOwner;
                    if(!commit.author.user){
                        console.log(`No user for commit: ${JSON.stringify(commit)}`);
                        continue;
                    }
                    const author = commit.author.user.login;
                    const commitDate = new Date(commit.authoredDate);

                    let update = false;
                    if (!contributorMap[author]) {
                        update = true;
                    }

                    if(contributorMap[author] && commitDate < contributorMap[author].earliestCommitDate){
                        update = true;
                    }

                    if(update){
                        contributorMap[author] = {
                            earliestCommitDate: commitDate,
                            earliestCommitUrl: commit.commitUrl,
                            earliestCommitRepo: `${repo}`,
                        };
                    }
                }
            }
        }
    }

    // sort the map by date
    const sortedContributorMap = Object.entries(contributorMap).sort((a, b) => {
        return a[1].earliestCommitDate - b[1].earliestCommitDate;
    });

    fs.writeFileSync(join(__dirname, "250-build-contributor-list", "contributors.json"), JSON.stringify(sortedContributorMap, null, 2));
}

main();
