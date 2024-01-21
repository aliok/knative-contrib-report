import {Task} from "@opentr/cuttlecat/dist/graphql/task.js";
import {v4 as uuidv4} from "uuid";


const PAGE_SIZE = 100;
const ORGS = ["knative", "knative-extensions"];

const QUERY = `
query OrganizationRepos($orgName: String!, $first: Int!, $after:String) {
    rateLimit{
        cost
        limit
        nodeCount
        remaining
        resetAt
        used
    }
    organization(login:$orgName) {
        login
        repositories(privacy: PUBLIC, first:$first, after:$after){
            pageInfo{
              endCursor,
              hasNextPage
            }
            nodes{
              ...{
                name
              }
            }
        }
    }
}
`;

export default class OrgReposCommand {

    createTask(ctx, spec) {
        return new OrgReposTask(spec);
    }

    createNewQueueItems() {
        const newTaskSpecs = [];

        // create tasks for each organization
        for (const orgName of ORGS) {
            const newSpec = {
                id: uuidv4(),
                parentId: null,
                originatingTaskId: null,
                //
                orgName: orgName,
                pageSize: PAGE_SIZE,
                startCursor: null,
            };
            newTaskSpecs.push(newSpec);
        }
        return newTaskSpecs;
    }
}

export class OrgReposTask extends Task {
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
            "first": this.spec.pageSize,
            "after": this.spec.startCursor,
        };
    }

    nextTask(context, result) {
        // return a new task if there is a next page
        if (result.organization.repositories.pageInfo.hasNextPage) {
            const newSpec = {
                id: uuidv4(),
                parentId: null,
                originatingTaskId: this.getId(context),
                //
                orgName: this.spec.orgName,
                pageSize: this.spec.pageSize,
                //
                startCursor: result.organization.repositories.pageInfo.endCursor
            };

            return new OrgReposTask(newSpec);
        }

        return null;
    }

    narrowedDownTasks(context) {
        return null;
    }

    saveOutput(context, output) {
        context.currentRunOutput.push({
            taskId: this.getId(context), result: output.organization,
        });
    }

}


