# knative-contrib-report

This repository contains a set of scripts to generate some reports about the Knative project:

- List of all contributors to the Knative project
- GitHub activities of managers (people who are reviewers, approvers, WG leads, etc.) for the last 12 months

Report #1:
- [100-fetch-repos.js](100-fetch-repos.js): Fetches all Knative repositories from GitHub.
- [150-build-repo-list.js](150-build-repo-list.js): Builds a list of all Knative repositories from the fetched data.
- [200-fetch-commits.js](200-fetch-commits.js): Fetches commits from all Knative repositories. It can fetch all commits or only commits from the last month.
- [250-build-contributor-list.js](250-build-contributor-list.js): Builds a list of all contributors from all fetched commits. Produces a JSON file.

Report #2:
- [300-fetch-managers.js](300-fetch-managers.js): Fetches all managers from the Knative Peribolos config.
- [310-fetch-manager-activities.js](310-fetch-manager-activities.js): Fetches activities of managers from GitHub for the last 12 months.
- [350-build-manager-activity-list.js](350-build-manager-activity-list.js): Builds a list of all manager activities from fetched activities. Produces a JSON file.

## How it works

This project uses [cuttlecat](https://github.com/OpenTRFoundation/cuttlecat) to fetch data from GitHub.
The good thing about cuttlecat is that it is designed to be run in a GitHub Actions workflow.
When there's a rate limit error, or when the process is interrupted, cuttlecat can continue from where it left off.

### List of all contributors to the Knative project

Workflow below is split into 2 GitHub Actions workflows. Each workflow is pushing its output to a separate branch.
Later in the workflow, if the process is finished, a PR is created to merge the branch into the main branch.

Workflow 1:
- Fetch repository list for Knative GitHub organizations
  - Store them in `100-fetch-repos` directory
  - Each directory contains the output of new execution of the process
  - The directory is named after the execution start timestamp
- Build repository list JSON file (repos.json) from the fetched data
  - Only use the latest fetched repository data

Workflow 2: 
- Fetch commits for all repositories
  - Use the repository list JSON file (repos.json)
  - Fetch commits for all repositories in that file
  - Store them in `200-fetch-commits` directory
  - Each directory contains the output of new execution of the process
  - The directory is named after the execution start timestamp
- Build contributor list JSON file (contributors.json) from the fetched data
  - Use all fetched commit data (not just latest)
  - The file contains a list of all contributors to the Knative project
  - It lists the first commit of the contributor

### GitHub activities of managers

Similar to the workflows of other report, this workflow is also split into multiple GitHub Actions workflows. Each workflow is pushing its output to a separate branch.

Workflow 1:
- Fetch manager list from Knative Peribolos config
  - Store them in `300-fetch-managers/managers.json` file

Workflow 2:
- Fetch activities of managers from GitHub for the last 12 months
  - Use the `managers.json` file
  - Fetch activities of managers from GitHub for the last 12 months
  - For both `knative` and `knative-extensions` organizations
  - Store the activities in `310-fetch-manager-activities` directory
  - Each directory contains the output of new execution of the process
  - The directory is named after the execution start timestamp
- Build manager activity list JSON file (`350-build-manager-activity-list/manager-activities.json`) from the fetched data
  - Use the latest fetched activity data only
  - The file contains a list of all manager activities for the last 12 months 

## Running locally

### List of all contributors to the Knative project

```shell

npm install

node node_modules/@opentr/cuttlecat/dist/index.js execute \
    --command-file="$(pwd)/100-fetch-repos.js" \
    --github-token="$(gh auth token)" \
    --data-directory="$(pwd)/100-fetch-repos" \
    --interval-cap="7" \
    --renew-period-in-days="30" \
    --log-level="info"
    
node 150-build-repo-list.js

# fetch all time data OR fetch data for the last month (below)
export ALL_TIME=true
# OR
export ALL_TIME=false

# fetch commits
node node_modules/@opentr/cuttlecat/dist/index.js execute \
    --command-file="$(pwd)/200-fetch-commits.js" \
    --github-token="$(gh auth token)" \
    --data-directory="$(pwd)/200-fetch-commits" \
    --interval-cap="7" \
    --renew-period-in-days="30" \
    --log-level="info"

# build contributor list from fetched data    
node 250-build-contributor-list.js
```

### GitHub activities of managers

```shell
npm install 

# build manager list from Knative Peribolos config    
node 300-fetch-managers.js

# fetch activities of managers
node node_modules/@opentr/cuttlecat/dist/index.js execute \
    --command-file="$(pwd)/310-fetch-manager-activities.js" \
    --github-token="$(gh auth token)" \
    --data-directory="$(pwd)/310-fetch-manager-activities" \
    --interval-cap="7" \
    --renew-period-in-days="30" \
    --log-level="info"
    
# build manager activity list from fetched data
node 350-build-manager-activity-list.js
```

## How to use the data

### List of all contributors to the Knative project
Check out [contributors.json](250-build-contributor-list/contributors.json) which contains a list of all contributors to the Knative project. It lists the first commit of the contributor. This file can be checked regularly (every month) to see if there are new contributors to the project.

The GitHub action for fetching the commits is manually run once to fetch all commits since the beginning of the project.

The current configuration is to fetch commits for last month. Thus, there's no need to fetch the old data again and again.
Thus, the contributors.json file will only contain the contributors up to the last month. 

### GitHub activities of managers
Checkout [manager-activities.json](350-build-manager-activity-list/manager-activities.json) which contains a list of all manager activities for the last 12 months. This file can be checked periodically to see if there are any inactive managers.

Similarly, [managers-without-contributions.json](350-build-manager-activity-list/managers-without-contributions.json) file contains a list of all managers who didn't contribute to the project for the last 12 months.
