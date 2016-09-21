#!/usr/bin/env node
import path from 'path'
import yargs from 'yargs'
import splitGuide from '../index'

yargs
  .usage('Usage: $0')
  .command('generate', 'generate your split-guide', {
    templatesDir: {
      default: inCwd('./templates'),
      coerce: coerceToCwd,
    },
    exercisesDir: {
      default: inCwd('./exercises'),
      coerce: coerceToCwd,
    },
    exercisesFinalDir: {
      default: inCwd('./exercises-final'),
      coerce: coerceToCwd,
    },
    noClean: {
      type: 'boolean',
    },
    ignore: {
      type: 'array',
    },
  }, generate)
  .help('h')
  .alias('h', 'help')
  .argv


function generate(options) {
  return splitGuide(options).then(result => {
    process.stdout.write(result)
  }, error => {
    process.stderr.write(error)
    return Promise.reject(error)
  })
}

function inCwd(p) {
  return path.resolve(process.cwd(), p)
}

function coerceToCwd(val) {
  if (path.isAbsolute(val)) {
    return val
  } else {
    return inCwd(val)
  }
}
