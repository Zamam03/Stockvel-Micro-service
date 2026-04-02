/**
 * Expose logError
 */

module.exports = logError

/**
 * logError
 */

function logError (err) {
  var msg = err.stack || err.toString()

  console.error()
  console.error(msg.replace(/^/gm, '  '))
  console.error()
}
