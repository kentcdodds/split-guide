/* eslint no-console:0 */

export {getErrorLogger, getThenLogger}

function getErrorLogger(title) {
  return err => {
    console.error(`There was an error: ${title}`, err)
    return Promise.reject(err)
  }
}

function getThenLogger(title) {
  return res => {
    console.error(title, res)
    return res
  }
}
