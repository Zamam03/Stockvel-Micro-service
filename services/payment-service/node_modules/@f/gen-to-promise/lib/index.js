/**
 * Modules
 */

var isDefer = require('@f/is-defer')
var isFunction = require('@f/is-function')
var isPromise = require('@f/is-promise')
var isIterator = require('@f/is-iterator')
var slice = require('@f/slice')

/**
 * Expose genToPromise
 */

module.exports = toPromise

/**
 * Generator to promise.
 * @param  {Generator} gen Generator.
 * @return {Promise}
 */

function toPromise (gen) {
  var self = this
  var args = slice(arguments, 1)
  return new Promise(function (resolve, reject) {
    if (isFunction(gen)) {
      gen = gen.apply(self, args)
    }

    if (!isIterator(gen)) {
      return resolve(gen)
    }

    var onFulfilled = iter('next')
    var onRejected = iter('throw')

    onFulfilled()

    function next (ret) {
      var val = ret.value
      if (ret.done) return resolve(val)
      if (isPromise(val)) {
        return val.then(onFulfilled, onRejected)
      } else if (isDefer(val)) {
        val = val.promise
      }
      return onFulfilled(val)
    }

    function iter (attr) {
      return function (res) {
        var ret
        try {
          ret = gen[attr](res)
        } catch (e) {
          return reject(e)
        }
        next(ret)
      }
    }
  })
}
