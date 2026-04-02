/**
 * Modules
 */

var extend = require('@f/extend')

/**
 * Expose setProto
 */

module.exports = setProto['default'] = setProto

/**
 * Give `obj` a new prototype.
 * @param {Object} proto `obj` new prototype.
 * @param {Object} obj The object which is to have its prototype set.
 */

function setProto (proto, obj) {
  if (!hasProto(obj)) {
    extend(obj, proto)
  } else if (Object.setPrototypeOf) {
    Object.setPrototypeOf(obj, proto)
  } else {
    obj.__proto__ = proto
  }

  return obj
}

function hasProto (obj) {
  return '__proto__' in obj
}
