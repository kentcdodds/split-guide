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
  console.log('here 1')
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
    console.log('here 2')
    const filesGlob = path.join(templatesDir, '**', '*')
    console.log('here 3')
    const globOptions = {nodir: true, ignore}
    console.log('here 4')
    return pify(glob)(filesGlob, globOptions)
  }

  function deletePreviouslyGeneratedFiles() {
    console.log('here 5')
    if (noClean) {
      console.log('here 6')
      return Promise.resolve()
    }
    console.log('here 7')
    const pRimraf = pify(rimraf)
    console.log('here 8')
    const opts = {disableGlob: true}
    console.log('here 9')
    return Promise.all([
      pRimraf(exercisesDir, opts),
      pRimraf(exercisesFinalDir, opts),
    ])
  }

  function readFileAsPromise(file) {
    console.log('here 10')
    return pify(fs.readFile)(file, 'utf8')
      .then(contents => ({file, contents}))
      .catch(getErrorLogger(`readFileAsPromise(${file})`))
  }

  function readAllFilesAsPromise(files) {
    console.log('here 11')
    const allPromises = files.map(readFileAsPromise)
    return Promise.all(allPromises)
  }

  function createNewFileContents(fileObjs) {
    console.log('here 12')
    return fileObjs.map(fileObj => {
      console.log('here 13')
      return Object.assign({
        finalContents: createFinalContents(fileObj.contents),
        workshopContents: createWorkshopContents(fileObj.contents),
      }, fileObj)
    })
  }

  function createFinalContents(contents) {
    console.log('here 14')
    return contents
    .replace(REGEX.final, '$1')
    .replace(REGEX.workshop, '')
    .replace(REGEX.comment, '')
  }

  function createWorkshopContents(contents) {
    console.log('here 15')
    return contents
    .replace(REGEX.workshop, '$1')
    .replace(REGEX.final, '')
    .replace(REGEX.comment, '')
  }

  function saveFiles(fileObjs) {
    console.log('here 16')
    const allPromises = fileObjs.reduce((all, fileObj) => {
      console.log('here 17')
      return [...all, ...saveFinalAndWorkshop(fileObj)]
    }, [])
    console.log('here 18')
    return Promise.all(allPromises)
  }

  function saveFinalAndWorkshop({file, workshopContents, finalContents}) {
    console.log('here 19')
    const relativeDestination = path.relative(templatesDir, file)
    console.log('here 20')
    const workshopDestination = path.resolve(exercisesDir, relativeDestination)
    console.log('here 21')
    const finalDestination = path.resolve(exercisesFinalDir, relativeDestination)
    console.log('here 22')
    return [
      workshopContents ? saveFile(workshopDestination, workshopContents) : null,
      finalContents ? saveFile(finalDestination, finalContents) : null,
    ].filter(p => !!p) // filter out the files that weren't saved
  }

  function saveFile(file, contents) {
    console.log('here 23')
    return pify(mkdirp)(path.dirname(file), {})
      .then(() => {
        console.log('here 24')
        return pify(fs.writeFile)(file, contents)
          .then(() => file, getErrorLogger(`fs.writeFile(${file}, <contents>)`))
      }, getErrorLogger(`mkdirp(${path.dirname(file)})`))
  }
}
