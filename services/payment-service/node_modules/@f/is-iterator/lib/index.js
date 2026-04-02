/**
 * Modules
 */

var isFunction = require('@f/is-function')

/**
 * Expose isIterator
 */

module.exports = isIterator['default'] = isIterator

/**
 * Check if iterator
 * @param  {Mixed}  obj Object to check interface of.
 * @return {Boolean}
 */

function isIterator (obj, strict) {
  return !!obj &&
    isFunction(obj.next) &&
    (obj.throw ? isFunction(obj.throw) : !strict)
}
