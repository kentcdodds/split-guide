#!/usr/bin/env node
import yargs from 'yargs'
import splitGuide from '../index'

yargs
  .usage('Usage: $0')
  .command('generate', 'generate your split-guide', {}, generate)
  .help('h')
  .alias('h', 'help')
  .argv

function generate() {
  splitGuide().then(result => {
    process.stdout.write(result)
  }, error => {
    process.stderr.write(error)
  })
}
