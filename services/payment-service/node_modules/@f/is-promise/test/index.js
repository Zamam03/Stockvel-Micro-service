/**
 * Imports
 */

var isPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('promise is promise', function (t) {
  t.equal(isPromise({then: function () {}}), true)
  t.end()
})

test('obj with then bool is not promise', function (t) {
  t.equal(isPromise({then: true}), false)
  t.end()
})

test('no arg is not promise', function (t) {
  t.equal(isPromise(), false)
  t.end()
})

test('null is not promise', function (t) {
  t.equal(isPromise(null), false)
  t.end()
})
