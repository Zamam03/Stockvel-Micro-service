/**
 * Expose isPromise
 */

module.exports = isPromise['default'] = isPromise

/**
 * Check if `val` is a promise.
 *
 * @param {Any} val
 * @return {Boolean}
 * @api private
 */

function isPromise (val) {
  return !!val && typeof val.then === 'function'
}
