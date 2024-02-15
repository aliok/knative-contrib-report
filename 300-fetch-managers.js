import * as fs from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import {load} from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "300-fetch-managers");

const FILES = [
    "https://raw.githubusercontent.com/knative/community/main/peribolos/knative-OWNERS_ALIASES",
    "https://raw.githubusercontent.com/knative/community/main/peribolos/knative-extensions-OWNERS_ALIASES",
    ];

const USERS_TO_IGNORE = [
    'knative-automation',
    'knative-prow-releaser-robot',
    'knative-prow-robot',
    'knative-prow-updater-robot',
    'knative-test-reporter-robot',
];

async function main() {
    const allManagers = new Set();

    for (const file of FILES) {
        // fetch the file in memory and extract the managers out of it
        const response = await fetch(file);
        const text = await response.text();

        const yaml = load(text);
        const aliases = yaml["aliases"];

        for (const aliasName in aliases) {
            const users = aliases[aliasName];
            for (const user of users) {
                if (USERS_TO_IGNORE.includes(user)) {
                    continue;
                }
                allManagers.add(user);
            }
        }
    }

    console.log("Found managers:", allManagers);

    fs.writeFileSync(join(OUTPUT_DIR, "managers.json"), JSON.stringify([...allManagers], null, 2));
}

(async () => {
    await main();
})();
