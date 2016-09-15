/* eslint no-console:0 */
import path from 'path'
import fs from 'fs'
import spawn from 'spawn-command'
import pify from 'pify'
import glob from 'glob'
import dirTree from 'directory-tree'

const SPLIT_GUIDE_PATH = require.resolve('./index')
const BABEL_BIN_PATH = require.resolve('babel-cli/bin/babel-node')

test('outputs helpful output', () => {
  return runSplitGuideCLI('--help').then(stdout => {
    expect(stdout).toMatchSnapshot()
  })
})

test('generates split-guides', () => {
  const generateFixtures = path.resolve(__dirname, '../../test/fixtures/generate')
  return runSplitGuideCLI('generate', generateFixtures).then(stdout => {
    expect(stdout).toMatchSnapshot()
    const tree = dirTree(generateFixtures)
    expect(tree).toMatchSnapshot()
    // cannot use Promise.all here because we need to make sure the snapshots are
    // taken in the correct order
    return expectDirectoryToMatchSnapshot(path.resolve(generateFixtures, './exercises'))
      .then(() => expectDirectoryToMatchSnapshot(path.resolve(generateFixtures, './exercises-final')))
  })
})

function expectDirectoryToMatchSnapshot(directory) {
  return pify(glob)(path.resolve(directory, '**/*'), {nodir: true})
    .then(readAllFilesAsPromise)
    .then(expectFilesToMatchSnapshot)

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function readFileAsPromise(file) {
    return pify(fs.readFile)(file, 'utf8').then(contents => ({file, contents}))
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
