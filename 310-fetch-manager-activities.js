import {Task} from "@opentr/cuttlecat/dist/graphql/task.js";
import {addMonths, endOfMonth, startOfMonth} from "date-fns";
import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import {v4 as uuidv4} from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));

// found like this:
// query{
//   organization(login:"knative-extensions"){
//     id
//   }
// }
const ORG_IDS = [
    "MDEyOk9yZ2FuaXphdGlvbjM1NTgzMjMz", // knative
    "MDEyOk9yZ2FuaXphdGlvbjU0MDgzNDM2", // knative-extensions
];

// language=GraphQL
const QUERY = `query GetActivities($orgId: ID!, $user: String!) {
    rateLimit{
        cost
        limit
        nodeCount
        remaining
        resetAt
        used
    }
    user(login:$user){
        login
        name
        contributionsCollection(organizationID:$orgId){
            startedAt
            endedAt
            hasAnyContributions

            totalCommitContributions
            totalIssueContributions
            totalRepositoryContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions

            totalRepositoriesWithContributedCommits
            totalRepositoriesWithContributedIssues


            commitContributionsByRepository(maxRepositories:100){
                repository{
                    nameWithOwner
                    url
                }
                url
                contributions{
                    totalCount
                }
            }
            issueContributionsByRepository(maxRepositories:100){
                repository{
                    nameWithOwner
                    url
                }
                contributions{
                    totalCount
                }
            }
            pullRequestContributionsByRepository(maxRepositories:100){
                repository{
                    nameWithOwner
                    url
                }
                contributions{
                    totalCount
                }
            }
            repositoryContributions(first:100){
                totalCount
            }
            pullRequestReviewContributionsByRepository(maxRepositories:100){
                repository{
                    nameWithOwner
                    url
                }
                contributions{
                    totalCount
                }
            }
        }
    }
}`;

export default class FetchManagerActivitiesCommand {

    createTask(ctx, spec) {
        return new FetchManagerActivitiesTask(spec);
    }

    createNewQueueItems() {
        let managerListFile = join(__dirname, "300-fetch-managers", "managers.json");
        let managers = JSON.parse(fs.readFileSync(managerListFile, "utf8"));

        const newTaskSpecs = [];

        // create a task for each repo
        for (const manager of managers) {
            for (const orgId of ORG_IDS) {
                const newSpec = {
                    id: uuidv4(),
                    parentId: null,
                    originatingTaskId: null,
                    //
                    orgId: orgId,
                    user: manager,
                };
                newTaskSpecs.push(newSpec);
            }
        }
        return newTaskSpecs;
    }
}

export class FetchManagerActivitiesTask extends Task {
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
            "orgId": this.spec.orgId,
            "user": this.spec.user,
        };
    }

    nextTask(context, result) {
        // ignore pagination
        return null;
    }

    narrowedDownTasks(context) {
        return null;
    }

    saveOutput(context, output) {
        context.currentRunOutput.push({
            taskId: this.getId(context), result: output.user,
        });
    }

}


