/* eslint no-console:0 */
import path from 'path'
import fs from 'fs'
import spawn from 'spawn-command'
import pify from 'pify'
import glob from 'glob'
import dirTree from 'directory-tree'

const SPLIT_GUIDE_PATH = require.resolve('./index')
const BABEL_BIN_PATH = require.resolve('babel-cli/bin/babel-node')

test('split-guide --help', () => {
  return runSplitGuideCLI('--help').then(stdout => {
    expect(stdout).toMatchSnapshot()
  })
})

test('split-guide generate', () => {
  return runCLIAndAssertFileOutput(
    'generate',
    path.resolve(__dirname, '../../test/fixtures/generate'),
  )
})

test('split-guide generate --templates-dir guides --exercises-dir app --exercises-final-dir app-finished', () => {
  return runCLIAndAssertFileOutput(
    'generate --templates-dir guides --exercises-dir app --exercises-final-dir app-finished',
    path.resolve(__dirname, '../../test/fixtures/generate-with-args'),
  )
})

test('split-guide generate --no-clean=true --exercises-dir src --exercises-final-dir src-final', () => {
  return runCLIAndAssertFileOutput(
    'generate --no-clean=true --exercises-dir src --exercises-final-dir src-final',
    path.resolve(__dirname, '../../test/fixtures/generate-no-clean'),
  )
})

test('split-guide generate --ignore "**/*.ignore-me.js"', () => {
  return runCLIAndAssertFileOutput(
    'generate --ignore "**/*.ignore-me.js"',
    path.resolve(__dirname, '../../test/fixtures/generate-ignore-one'),
  )
})

test('split-guide generate --ignore "**/*.ignore-me.js" "**/*.no-copy.js"', () => {
  return runCLIAndAssertFileOutput(
    'generate --ignore "**/*.ignore-me.js" "**/*.no-copy.js"',
    path.resolve(__dirname, '../../test/fixtures/generate-ignore-multiple'),
  )
})

function runCLIAndAssertFileOutput(args, cwd) {
  return runSplitGuideCLI(args, cwd).then(stdout => {
    expect(stdout).toMatchSnapshot()
    const tree = dirTree(cwd)
    relativeizePathInTree(tree)
    expect(tree).toMatchSnapshot()
    // cannot use Promise.all here because we need to make sure the snapshots are
    // taken in the correct order
    return expectDirectoryToMatchSnapshot(path.resolve(cwd, './exercises'))
      .then(() => expectDirectoryToMatchSnapshot(path.resolve(cwd, './exercises-final')))
  })
}

function expectDirectoryToMatchSnapshot(directory) {
  return pify(glob)(path.resolve(directory, '**/*'), {nodir: true})
    .then(readAllFilesAsPromise)
    .then(expectFilesToMatchSnapshot)

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function readFileAsPromise(file) {
    return pify(fs.readFile)(file, 'utf8')
      .then(contents => ({file: relativeizePath(file), contents}))
  }

  function expectFilesToMatchSnapshot(files) {
    expect(files).toMatchSnapshot()
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
    const command = `${BABEL_BIN_PATH} ${SPLIT_GUIDE_PATH} ${args}`
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

function relativeizePath(absolutePath) {
  return absolutePath.replace(path.resolve(__dirname, '../../'), '<projectRootDir>')
}

function relativeizePathInTree(tree) {
  tree.path = relativeizePath(tree.path)
  if (tree.children) {
    tree.children.forEach(relativeizePathInTree)
  }
}
