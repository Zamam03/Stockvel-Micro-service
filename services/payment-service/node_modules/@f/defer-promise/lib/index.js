/**
 * Expose deferPromise
 */

module.exports = deferPromise

/**
 * deferPromise
 */

function deferPromise () {
  var deferred = {}
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve
    deferred.reject = reject
  })
  return deferred
}
