/**
 * Modules
 */

var slice = require('@f/slice')

/**
 * Expose thunkToPromise
 */

module.exports = thunkToPromise['default'] = thunkToPromise

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise (fn) {
  var ctx = this
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err)
      if (arguments.length > 2) res = slice(arguments, 1)
      resolve(res)
    })
  })
}
