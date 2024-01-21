import {Task} from "@opentr/cuttlecat/dist/graphql/task.js";
import {addMonths, endOfMonth, startOfMonth} from "date-fns";
import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import {v4 as uuidv4} from "uuid";

const PAGE_SIZE = 100;
const __dirname = dirname(fileURLToPath(import.meta.url));

const ALL_TIME = process.env["ALL_TIME"] === "true";

let START_DATE;
let END_DATE;

if (ALL_TIME) {
    // from the start of GitHub to start of last month
    START_DATE = new Date("2008-01-01T00:00:00Z");
    END_DATE = endOfMonth(addMonths(new Date(), -2));
} else {
    // last month only
    START_DATE = startOfMonth(addMonths(new Date(), -1));
    END_DATE = endOfMonth(addMonths(new Date(), -1));
}

console.log(`Fetching commits from ${START_DATE.toISOString()} to ${END_DATE.toISOString()}`);

// language=GraphQL
const QUERY = `query RepoCommits($orgName: String!, $repoName: String!, $since: GitTimestamp!, $until: GitTimestamp!, $first: Int!, $after: String) {
    rateLimit{
        cost
        limit
        nodeCount
        remaining
        resetAt
        used
    }
    repository(owner:$orgName, name:$repoName){
        nameWithOwner,
        defaultBranchRef{
            name
            target{
                ...on Commit{
                    history(first:$first, after:$after, since:$since, until:$until){
                        totalCount
                        pageInfo{
                            hasNextPage
                            endCursor
                        }
                        nodes{
                            ...on Commit{
                                author{
                                    user{
                                        login
                                    }
                                }
                                authoredDate,
                                commitUrl
                            }
                        }
                    }
                }
            }
        }
    }
}
`;

export default class FetchCommitsCommand {

    createTask(ctx, spec) {
        return new FetchCommitsTask(spec);
    }

    createNewQueueItems() {
        let repoListFile = join(__dirname, "150-build-repo-list", "repos.json");
        let repos = JSON.parse(fs.readFileSync(repoListFile, "utf8"));

        const newTaskSpecs = [];

        // create a task for each repo
        for (const repoNameWithOwner of repos) {
            const orgName = repoNameWithOwner.split("/")[0];
            const repoName = repoNameWithOwner.split("/")[1];

            const newSpec = {
                id: uuidv4(),
                parentId: null,
                originatingTaskId: null,
                //
                orgName: orgName,
                repoName: repoName,
                pageSize: PAGE_SIZE,
                startCursor: null,
                since: START_DATE.toISOString(),
                until: END_DATE.toISOString()
            };
            newTaskSpecs.push(newSpec);
        }
        return newTaskSpecs;
    }
}

export class FetchCommitsTask extends Task {
    spec;

    constructor(spec) {
        super(spec);
        this.spec = spec;
    }

    getGraphqlQuery() {
        return QUERY;
    }

    buildQueryParameters() {
        return {
            "orgName": this.spec.orgName,
            "repoName": this.spec.repoName,
            "first": this.spec.pageSize,
            "after": this.spec.startCursor,
            "since": this.spec.since,
            "until": this.spec.until,
        };
    }

    nextTask(context, result) {
        // return a new task if there is a next page
        if (result.repository.defaultBranchRef.target.history.pageInfo.hasNextPage) {
            const newSpec = {
                id: uuidv4(),
                parentId: null,
                originatingTaskId: this.getId(context),
                //
                orgName: this.spec.orgName,
                repoName: this.spec.repoName,
                pageSize: this.spec.pageSize,
                since: this.spec.since,
                until: this.spec.until,
                //
                startCursor: result.repository.defaultBranchRef.target.history.pageInfo.endCursor
            };

            return new FetchCommitsTask(newSpec);
        }

        return null;
    }

    narrowedDownTasks(context) {
        return null;
    }

    saveOutput(context, output) {
        context.currentRunOutput.push({
            taskId: this.getId(context), result: output.repository,
        });
    }

}


