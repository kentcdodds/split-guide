#!/usr/bin/env node
import path from 'path'
import yargs from 'yargs'
import chalk from 'chalk'
import {oneLine} from 'common-tags'
import splitGuide from '../index'

// eslint-disable-next-line babel/no-unused-expressions
yargs
  .usage('Usage: $0')
  .command(
    'generate',
    'generate your split-guide',
    {
      templatesDir: {
        description: 'The directory where your templates are',
        default: inCwd('./templates'),
        coerce: coerceToCwd,
      },
      exercisesDir: {
        description: 'Where you want the exercises split to go',
        default: inCwd('./exercises'),
        coerce: coerceToCwd,
      },
      exercisesFinalDir: {
        description: 'Where you want the final split to go',
        default: inCwd('./exercises-final'),
        coerce: coerceToCwd,
      },
      clean: {
        description: oneLine`
        Deletes the exercises and
        exercises-final to keep your space clean
      `,
        default: true,
        type: 'boolean',
      },
      ignore: {
        description: 'Globs you would like to ignore',
        type: 'array',
      },
      silentSuccess: {
        description: 'Whether to log success',
        type: 'boolean',
      },
      silentAll: {
        description: 'Whether to log at all',
        type: 'boolean',
      },
    },
    generate,
  )
  .help('h')
  .alias('h', 'help').argv

function generate(options) {
  return splitGuide(options).then(
    savedFiles => {
      if (!options.silentSuccess && !options.silentAll) {
        const count = savedFiles.length
        const files = `file${count === 1 ? '' : 's'}`
        const colon = `${count === 0 ? '' : ':'}`
        process.stdout.write(
          `
${chalk.reset.green(`Saved ${count} ${files}${colon}`)}
${savedFiles.join('\n')}
          `.trim(),
        )
      }
      return savedFiles
    },
    error => {
      if (!options.silentAll) {
        process.stderr.write(error.toString())
      }
      return Promise.reject(error)
    },
  )
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
