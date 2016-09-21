/* eslint no-console:0 */
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import pify from 'pify'
import {getErrorLogger} from './utils'

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
  console.log('here')
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
    console.log('here')
    const filesGlob = path.join(templatesDir, '**', '*')
    console.log('here')
    const globOptions = {nodir: true, ignore}
    console.log('here')
    return pify(glob)(filesGlob, globOptions)
  }

  function deletePreviouslyGeneratedFiles() {
    console.log('here')
    if (noClean) {
      console.log('here')
      return Promise.resolve()
    }
    console.log('here')
    const pRimraf = pify(rimraf)
    console.log('here')
    const opts = {disableGlob: true}
    console.log('here')
    return Promise.all([
      pRimraf(exercisesDir, opts),
      pRimraf(exercisesFinalDir, opts),
    ])
  }

  function readFileAsPromise(file) {
    console.log('here')
    return pify(fs.readFile)(file, 'utf8')
      .then(contents => ({file, contents}))
      .catch(getErrorLogger(`readFileAsPromise(${file})`))
  }

  function readAllFilesAsPromise(files) {
    console.log('here')
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function createNewFileContents(fileObjs) {
    console.log('here')
    return fileObjs.map(fileObj => {
      console.log('here')
      return Object.assign({
        finalContents: createFinalContents(fileObj.contents),
        workshopContents: createWorkshopContents(fileObj.contents),
      }, fileObj)
    })
  }

  function createFinalContents(contents) {
    console.log('here')
    return contents
    .replace(REGEX.final, '$1')
    .replace(REGEX.workshop, '')
    .replace(REGEX.comment, '')
  }

  function createWorkshopContents(contents) {
    console.log('here')
    return contents
    .replace(REGEX.workshop, '$1')
    .replace(REGEX.final, '')
    .replace(REGEX.comment, '')
  }

  function saveFiles(fileObjs) {
    console.log('here')
    const allPromises = fileObjs.reduce((all, fileObj) => {
      console.log('here')
      return [...all, ...saveFinalAndWorkshop(fileObj)]
    }, [])
    console.log('here')
    return Promise.all(allPromises)
  }

  function saveFinalAndWorkshop({file, workshopContents, finalContents}) {
    console.log('here')
    const relativeDestination = path.relative(templatesDir, file)
    console.log('here')
    const workshopDestination = path.resolve(exercisesDir, relativeDestination)
    console.log('here')
    const finalDestination = path.resolve(exercisesFinalDir, relativeDestination)
    console.log('here')
    return [
      workshopContents ? saveFile(workshopDestination, workshopContents) : null,
      finalContents ? saveFile(finalDestination, finalContents) : null,
    ].filter(p => !!p) // filter out the files that weren't saved
  }

  function saveFile(file, contents) {
    console.log('here')
    return pify(mkdirp)(path.dirname(file), {})
      .then(() => {
        console.log('here')
        return pify(fs.writeFile)(file, contents)
          .then(() => file, getErrorLogger(`fs.writeFile(${file}, <contents>)`))
      }, getErrorLogger(`mkdirp(${path.dirname(file)})`))
  }
}
