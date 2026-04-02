/**
 * Modules
 */

var forEach = require('@f/foreach-array')

/**
 * Expose values
 */

module.exports = values

/**
 * Return an array of the values in `obj`, maintaining the same order as
 * Object.keys.
 *
 * @param  {Object} obj
 * @return {Array} The array of values
 */

function values (obj, keys) {
  keys = keys || Object.keys(obj)
  var arr = []
  forEach(push, keys)
  return arr

  function push (key) {
    arr.push(obj[key])
  }
}
