/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
    api: { projectId: 'ow03d9eg', dataset: 'production' },
    deployment: {
        appId: 'vzk8os00lyu9cwzd4bltn5wh',
    },
})

