import fs from 'fs'
import path from 'path'
import glob from 'glob'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import pify from 'pify'

const REGEX = {
  final: / *?\/\/ FINAL_START.*?\n((.|\n|\r)*?) *\/\/ FINAL_END.*?\n/g,
  workshop: / *?\/\/ WORKSHOP_START.*?\n((.|\n|\r)*?) *\/\/ WORKSHOP_END.*?\n/g,
  comment: / *?\/\/ COMMENT_START.*?\n((.|\n|\r)*?) *\/\/ COMMENT_END.*?\n/g,
}

export default splitGuide

function splitGuide() {
  const filesGlob = path.resolve(process.cwd(), './templates/**/*')
  const globOptions = {nodir: true}
  return deletePreviouslyGeneratedFiles()
    .then(() => pify(glob)(filesGlob, globOptions))
    .then(readAllFilesAsPromise)
    .then(createNewFileContents)
    .then(saveFiles)
}

function deletePreviouslyGeneratedFiles() {
  const workshopDestination = path.resolve(process.cwd(), 'exercises')
  const finalDestination = path.resolve(process.cwd(), 'exercises-final')
  const pRimraf = pify(rimraf)
  const opts = {disableGlob: true}
  return Promise.all([
    pRimraf(workshopDestination, opts),
    pRimraf(finalDestination, opts),
  ])
}

function readFileAsPromise(file) {
  return pify(fs.readFile)(file, 'utf8').then(contents => ({file, contents}))
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
  const relativeDestination = path.relative(path.resolve(process.cwd(), 'templates'), file)
  const workshopDestination = path.resolve(process.cwd(), 'exercises', relativeDestination)
  const finalDestination = path.resolve(process.cwd(), 'exercises-final', relativeDestination)
  return [
    workshopContents ? saveFile(workshopDestination, workshopContents) : null,
    finalContents ? saveFile(finalDestination, finalContents) : null,
  ].filter(p => !!p) // filter out the files that weren't saved
}

function saveFile(file, contents) {
  return pify(mkdirp)(path.dirname(file), {}).then(() => {
    return pify(fs.writeFile)(file, contents).then(() => file)
  })
}
