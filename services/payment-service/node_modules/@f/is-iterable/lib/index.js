/**
 * Modules
 */

var iteratorSymbol = require('@f/iterator-symbol')
var isFunction = require('@f/is-function')

/**
 * Expose isIterable
 */

module.exports = isIterable['default'] = isIterable


/**
 * Check if `obj` is iterable.
 * @param  {Mixed}  obj
 * @return {Boolean}
 */

function isIterable (obj) {
  return !!obj && isFunction(obj[iteratorSymbol])
}
