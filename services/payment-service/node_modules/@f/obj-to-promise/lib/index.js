/**
 * Modules
 */

var zip = require('@f/zip-obj')
var values = require('@f/values')
var curry = require('@f/curry-once')

/**
 * Expose objectToPromise
 */

module.exports = objectToPromise

/**
 * Convert an object to a promise resolving vals with `toPromise`.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise (obj) {
  var keys = Object.keys(obj)
  var promises = values(obj, keys)
  return Promise.all(promises).then(curry(zip)(keys))
}
