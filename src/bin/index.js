#!/usr/bin/env node
import yargs from 'yargs'
import splitGuide from '../index'

const args = yargs
  .usage('Usage: $0')
  .command('generate', 'generate your split-guide')
  .help('h')
  .alias('h', 'help')
  .argv

if (args.generate) {
  splitGuide().then(result => {
    process.stdout.write(result)
  }, error => {
    process.stderr.write(error)
  })
}
