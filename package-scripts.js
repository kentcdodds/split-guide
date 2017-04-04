const npsUtils = require('nps-utils')

const commonTags = npsUtils.commonTags
const oneLine = commonTags.oneLine
const series = npsUtils.series
const rimraf = npsUtils.rimraf

module.exports = {
  scripts: {
    commit: {
      description: oneLine`
        This uses commitizen to help us
        generate well formatted commit messages
      `,
      script: 'git-cz',
    },
    test: {
      default: `jest`,
      watch: 'jest --watch',
    },
    build: {
      description: 'delete the dist directory and run babel to build the files',
      script: series(
        rimraf('dist'),
        'babel --copy-files --out-dir dist --ignore *.test.js,__snapshots__ src'
      ),
    },
    lint: {
      description: 'lint the entire project',
      script: 'eslint .',
    },
    release: {
      description: oneLine`
        We automate releases with semantic-release.
        This should only be run on travis
      `,
      script: series(
        'semantic-release pre',
        'npm publish',
        'semantic-release post'
      ),
    },
    validate: {
      description: oneLine`
        This runs several scripts to make sure things
        look good before committing or on clean install
      `,
      // not sure why, but snapshots
      // seemed to fail when it was done concurrently
      script: series.nps('lint', 'build', 'test'),
    },
    addContributor: {
      description: 'When new people contribute to the project, run this',
      script: 'all-contributors add',
    },
    generateContributors: {
      description: 'Update the badge and contributors table',
      script: 'all-contributors generate',
    },
  },
  options: {
    silent: false,
  },
}

// this is not transpiled
/*
  eslint
  comma-dangle: [
    2,
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      functions: 'never'
    }
  ]
 */
