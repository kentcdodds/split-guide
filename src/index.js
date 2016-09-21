import fs from 'fs'
import path from 'path'
import glob from 'glob'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import pify from 'pify'
import {getErrorLogger, getThenLogger} from './utils'

const REGEX = {
  final: / *?\/\/ FINAL_START.*?\n((.|\n|\r)*?) *\/\/ FINAL_END.*?\n/g,
  workshop: / *?\/\/ WORKSHOP_START.*?\n((.|\n|\r)*?) *\/\/ WORKSHOP_END.*?\n/g,
  comment: / *?\/\/ COMMENT_START.*?\n((.|\n|\r)*?) *\/\/ COMMENT_END.*?\n/g,
}

export default splitGuide

function splitGuide({
  templatesDir,
  exercisesDir,
  exercisesFinalDir,
  noClean,
  ignore,
} = {}) {
  return deletePreviouslyGeneratedFiles()
    .catch(getErrorLogger('deletePreviouslyGeneratedFiles'))
    .then(getFiles)
    .catch(getErrorLogger('getFiles'))
    .then(readAllFilesAsPromise)
    .catch(getErrorLogger('readAllFilesAsPromise'))
    .then(createNewFileContents)
    .catch(getErrorLogger('createNewFileContents'))
    .then(saveFiles)
    .catch(getErrorLogger('saveFiles'))

  function getFiles() {
    const filesGlob = path.join(templatesDir, '**', '*')
    const globOptions = {nodir: true, ignore}
    return pify(glob)(filesGlob, globOptions)
  }

  function deletePreviouslyGeneratedFiles() {
    if (noClean) {
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
    return pify(fs.readFile)(file, 'utf8')
      .then(contents => ({file, contents}))
      .then(getThenLogger(`file ${file} read`))
      .catch(getErrorLogger(`readFileAsPromise(${file})`))
  }

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function createNewFileContents(fileObjs) {
    return fileObjs.map(fileObj => {
      return Object.assign({
        finalContents: createFinalContents(fileObj.contents),
        workshopContents: createWorkshopContents(fileObj.contents),
      }, fileObj)
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
    const finalDestination = path.resolve(exercisesFinalDir, relativeDestination)
    return [
      workshopContents ? saveFile(workshopDestination, workshopContents) : null,
      finalContents ? saveFile(finalDestination, finalContents) : null,
    ].filter(p => !!p) // filter out the files that weren't saved
  }

  function saveFile(file, contents) {
    return pify(mkdirp)(path.dirname(file), {})
      .then(() => {
        return pify(fs.writeFile)(file, contents, 'utf8')
          .then(getThenLogger(`Wrote to ${file}`))
          .then(() => file, getErrorLogger(`fs.writeFile(${file}, <contents>)`))
      }, getErrorLogger(`mkdirp(${path.dirname(file)})`))
  }
}
