import fs from 'fs'
import path from 'path'
import glob from 'glob'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import pify from 'pify'
import pLimit from 'p-limit'
import {getErrorLogger} from './utils'

// We need to escape \ when used with constructor
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
const CommentStartTpl = '(?:\\/\\/\\s|\\/\\*\\s?|<!--\\s?)'
const CommentEndTpl = '.*?\\n'

const getRegEx = entity =>
  ` *?${CommentStartTpl}${entity}_START${CommentEndTpl}((.|\n|\r)*?) *${CommentStartTpl}${entity}_END${CommentEndTpl}`

const REGEX = {
  final: new RegExp(getRegEx('FINAL'), 'g'),
  workshop: new RegExp(getRegEx('WORKSHOP'), 'g'),
  comment: new RegExp(getRegEx('COMMENT'), 'g'),
}
const openFileLimit = pLimit(100)

export default splitGuide

function splitGuide({
  templatesDir,
  exercisesDir,
  exercisesFinalDir,
  clean,
  ignore,
} = {}) {
  return deletePreviouslyGeneratedFiles()
    .then(getFiles)
    .then(readAllFilesAsPromise)
    .then(createNewFileContents)
    .then(saveFiles)

  function getFiles() {
    const filesGlob = path.join(templatesDir, '**', '*')
    const globOptions = {nodir: true, ignore, dot: true}
    return pify(glob)(filesGlob, globOptions)
  }

  function deletePreviouslyGeneratedFiles() {
    if (!clean) {
      return Promise.resolve()
    }
    const pRimraf = pify(rimraf)
    const opts = {disableGlob: true}
    return Promise.all([
      pRimraf(exercisesDir, opts),
      pRimraf(exercisesFinalDir, opts),
    ])
  }

  function readFileAsPromise(file) {
    return pify(fs.readFile)(file, 'utf8').then(contents => ({file, contents}))
  }

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(file =>
      openFileLimit(() => readFileAsPromise(file)),
    )
    return Promise.all(allPromises)
  }

  function createNewFileContents(fileObjs) {
    return fileObjs.map(fileObj => {
      return {
        finalContents: createFinalContents(fileObj.contents),
        workshopContents: createWorkshopContents(fileObj.contents),
        ...fileObj,
      }
    })
  }

  function createFinalContents(contents) {
    return contents
      .replace(REGEX.final, '$1')
      .replace(REGEX.workshop, '')
      .replace(REGEX.comment, '')
  }

  function createWorkshopContents(contents) {
    return contents
      .replace(REGEX.workshop, '$1')
      .replace(REGEX.final, '')
      .replace(REGEX.comment, '')
  }

  function saveFiles(fileObjs) {
    const allPromises = fileObjs.reduce((all, fileObj) => {
      return [...all, ...saveFinalAndWorkshop(fileObj)]
    }, [])
    return Promise.all(allPromises)
  }

  function saveFinalAndWorkshop({file, workshopContents, finalContents}) {
    const relativeDestination = path.relative(templatesDir, file)
    const workshopDestination = path.resolve(exercisesDir, relativeDestination)
    const finalDestination = path.resolve(
      exercisesFinalDir,
      relativeDestination,
    )
    return [
      workshopContents
        ? openFileLimit(() => saveFile(workshopDestination, workshopContents))
        : null,
      finalContents
        ? openFileLimit(() => saveFile(finalDestination, finalContents))
        : null,
    ].filter(Boolean) // filter out the files that weren't saved
  }

  function saveFile(file, contents) {
    return pify(mkdirp)(path.dirname(file), {}).then(() => {
      return pify(fs.writeFile)(file, contents).then(() => file)
    }, getErrorLogger(`mkdirp(${path.dirname(file)})`))
  }
}
