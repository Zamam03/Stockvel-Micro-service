/**
 * Modules
 */

/**
 * Expose zipObj
 */

module.exports = zipObj['default'] = zipObj

/**
 * zipObj
 */

function zipObj (keys, values) {
  var obj = {}
  for (var i = 0; i < keys.length; i++) {
    obj[keys[i]] = values[i]
  }
  return obj
}
