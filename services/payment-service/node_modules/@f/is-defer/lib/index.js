/**
 * Modules
 */

var isPromise = require('@f/is-promise')

/**
 * Expose isDefer
 */

module.exports = isDefer

/**
 * isDefer
 */

function isDefer (val, strict) {
  return !!val && isPromise(val.promise) && (!strict || val.resolve && val.reject)
}
