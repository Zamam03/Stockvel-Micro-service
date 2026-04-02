/**
 * Imports
 */

var isFunction = require('@f/is-function')

/**
 * Expose isGenerator
 */

module.exports = isGenerator['default'] = isGenerator

/**
 * Check if `fn` is a generator function.
 *
 * @param {Mixed} fn
 * @return {Boolean}
 */

function isGenerator (fn) {
  var ctor = isFunction(fn) && fn.constructor
  if (!ctor) return false
  return ctor.name === 'GeneratorFunction' || ctor.displayName === 'GeneratorFunction'
}
