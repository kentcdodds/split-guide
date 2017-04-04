import path from 'path'
import fs from 'fs'
import spawn from 'spawn-command'
import pify from 'pify'
import glob from 'glob'
import dirTree from 'directory-tree'
import yargsParser from 'yargs-parser'
import {oneLine} from 'common-tags'
import {getErrorLogger} from '../utils'

// this is a bit of a long running test...
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000 // eslint-disable-line no-undef

const SPLIT_GUIDE_PATH = require.resolve('./index')
const BABEL_BIN_PATH = require.resolve('babel-cli/bin/babel-node')

test('split-guide --help', () => {
  return runSplitGuideCLI('--help').then(stdout => {
    expect(stdout).toMatchSnapshot('split-guide --help stdout')
  })
})

testCLIOutput('generate', 'generate')
testCLIOutput(
  oneLine`
    generate
    --templates-dir guides
    --exercises-dir app --exercises-final-dir
    app-finished
  `,
  'generate-with-args',
)
testCLIOutput(
  oneLine`
    generate
    --no-clean
    --exercises-dir src
    --exercises-final-dir src-final
  `,
  'generate-no-clean',
)
testCLIOutput('generate --ignore "**/*.ignore-me.js"', 'generate-ignore-one')
testCLIOutput(
  'generate --ignore "**/*.ignore-me.js" "**/*.no-copy.js"',
  'generate-ignore-multiple',
)
testCLIOutput('generate --silent-success', 'generate-silent-success')
testCLIOutput('generate --silent-all', 'generate-silent-all')

function testCLIOutput(args, fixture) {
  test(`split-guide ${args}`, () => {
    return runCLIAndAssertFileOutput(
      args,
      path.resolve(__dirname, `../../test/fixtures/${fixture}`),
    )
  })
}

async function runCLIAndAssertFileOutput(args, cwd) {
  const {
    exercisesDir = './exercises',
    exercisesFinalDir = './exercises-final',
  } = yargsParser(args)
  const stdout = await runSplitGuideCLI(args, cwd).catch(
    getErrorLogger('runSplitGuideCLI'),
  )
  const snapshotTitleBase = `${args} in ${relativeizePath(cwd)}`
  expect(relativeizePath(stdout)).toMatchSnapshot(
    `${snapshotTitleBase} stdout`,
  )
  const tree = dirTree(cwd)
  relativeizePathInTree(tree)
  expect(tree).toMatchSnapshot(`${snapshotTitleBase} file tree`)
  // cannot use Promise.all here because we need to make sure the snapshots are
  // taken in the correct order
  await expectDirectoryToMatchSnapshot(
    path.resolve(cwd, exercisesDir),
    `${snapshotTitleBase} exercises-dir`,
  )
  await expectDirectoryToMatchSnapshot(
    path.resolve(cwd, exercisesFinalDir),
    `${snapshotTitleBase} exercises-final-dir`,
  )
}

function expectDirectoryToMatchSnapshot(directory, snapshotTitle) {
  return pify(glob)(path.resolve(directory, '**/*'), {nodir: true})
    .then(readAllFilesAsPromise)
    .then(expectFilesToMatchSnapshot)
    .catch(getErrorLogger(`expectDirectoryToMatchSnapshot(${directory})`))

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function readFileAsPromise(file) {
    return pify(fs.readFile)(file, 'utf8')
      .then(contents => ({file: relativeizePath(file), contents}))
      .catch(getErrorLogger(`readFileAsPromise(${file})`))
  }

  function expectFilesToMatchSnapshot(files) {
    expect(files).toMatchSnapshot(snapshotTitle)
  }
}

function runSplitGuideCLI(args = '', cwd = process.cwd()) {
  const isRelative = cwd[0] !== '/'
  if (isRelative) {
    cwd = path.resolve(__dirname, cwd)
  }

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const command = `${BABEL_BIN_PATH} -- ${SPLIT_GUIDE_PATH} ${args}`
    const child = spawn(command, {cwd})

    child.on('error', error => {
      reject(error)
    })

    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('close', () => {
      if (stderr) {
        reject(stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

function relativeizePath(stringWithAbsolutePaths) {
  return stringWithAbsolutePaths.replace(
    new RegExp(path.resolve(__dirname, '../../'), 'g'),
    '<projectRootDir>',
  )
}

function relativeizePathInTree(tree) {
  tree.path = relativeizePath(tree.path)
  if (tree.children) {
    tree.children.forEach(relativeizePathInTree)
  }
}
