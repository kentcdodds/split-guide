#!/usr/bin/env node
import path from 'path'
import yargs from 'yargs'
import chalk from 'chalk'
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
    silentSuccess: {
      type: 'boolean',
    },
    silentAll: {
      type: 'boolean',
    },
  }, generate)
  .help('h')
  .alias('h', 'help')
  .argv


function generate(options) {
  return splitGuide(options).then(savedFiles => {
    if (!options.silentSuccess && !options.silentAll) {
      const count = savedFiles.length
      const files = `file${count === 1 ? '' : 's'}`
      const colon = `${count === 0 ? '' : ':'}`
      process.stdout.write(`
${chalk.green(`Saved ${count} ${files}${colon}`)}
${savedFiles.join('\n')}
      `.trim())
    }
    return savedFiles
  }, error => {
    if (!options.silentAll) {
      process.stderr.write(error.toString())
    }
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
