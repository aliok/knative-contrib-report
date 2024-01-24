# knative-contrib-report

This repository contains a set of scripts to generate a report of contributors to the Knative project.

Workflow:
- [100-fetch-repos.js](100-fetch-repos.js): Fetches all Knative repositories from GitHub.
- [150-build-repo-list.js](150-build-repo-list.js): Builds a list of all Knative repositories from the fetched data.
- [200-fetch-commits.js](200-fetch-commits.js): Fetches commits from all Knative repositories. It can fetch all commits or only commits from the last month.
- [250-build-contributor-list.js](250-build-contributor-list.js): Builds a list of all contributors from all fetched commits. Produces a JSON file.

## How it works

## Running locally

Running locally:
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

## How to use the data

Check out [contributors.json](250-build-contributor-list/contributors.json) which contains a list of all contributors to the Knative project. It lists the first commit of the contributor. This file can be checked regularly (every month) to see if there are new contributors to the project.

The GitHub action for fetching the commits is manually run once to fetch all commits since the beginning of the project.

The current configuration is to fetch commits for last month. Thus, there's no need to fetch the old data again and again.
Thus, the contributors.json file will only contain the contributors up to the last month. 
