/**
 * Modules
 */

/**
 * Expose arrayToPromise
 */

module.exports = arrayToPromise['default'] = arrayToPromise

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj);
}
