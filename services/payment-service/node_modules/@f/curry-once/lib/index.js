/**
 * Modules
 */

var slice = require('@f/slice')

/**
 * Expose curry
 */

module.exports = curry

/**
 * Simple curry function, essentially a curried partial.
 * @param  {Function} fn
 * @return {Function}
 */

function curry (fn) {
  var self = this
  return function () {
    var preArgs = new Array(arguments.length)
    for (var i = 0; i < preArgs.length; i++) {
      preArgs[i] = arguments[i]
    }
    return function () {
      var args = slice(preArgs)
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      return fn.apply(self, args)
    }
  }
}
