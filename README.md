# knative-contrib-report

This repository contains a set of scripts to generate a report of contributors to the Knative project.

Workflow:
- [100-fetch-repos.js](100-fetch-repos.js): Fetches all Knative repositories from GitHub.
- [150-build-repo-list.js](150-build-repo-list.js): Builds a list of all Knative repositories from the fetched data.
- [200-fetch-commits.js](200-fetch-commits.js): Fetches all commits from all Knative repositories.
- [250-build-contributor-list.js](250-build-contributor-list.js): Builds a list of all contributors from the fetched data.

TODO:
- Generate a static HTML report
- Document the report generation process
- Give credits to cuttlecat

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
