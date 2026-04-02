/**
 * Imports
 */

var deferPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should have same api as node Promise.defer()', function (t) {
  var deferred = deferPromise()
  t.ok(deferred.promise)
  t.ok(deferred.resolve)
  t.ok(deferred.reject)
  t.end()
})

test('should resolve', function (t) {
  t.plan(1)

  var deferred = deferPromise()
  deferred.promise.then(function (val) {
    t.equal(val, 42)
  })
  deferred.resolve(42)
})

test('should reject', function (t) {
  t.plan(1)

  var deferred = deferPromise()
  deferred.promise.catch(function (val) {
    t.equal(val, 42)
  })
  deferred.reject(42)
})
