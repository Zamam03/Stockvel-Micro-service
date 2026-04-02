/**
 * Imports
 */

var isGenerator = require('..')
var test = require('tape')

/**
 * Tests
 */

test('generator is generator', function (t) {
  t.equal(isGenerator(function * () {}), true)
  t.end()
})

test('generator object is not generator', function (t) {
  t.equal(isGenerator(function * () {}()), false)
  t.end()
})

test('almost generator is not generator', function (t) {
  t.equal(isGenerator({ next: function () {} }), false)
  t.end()
})

test('no arg is not generator', function (t) {
  t.equal(isGenerator(), false)
  t.end()
})

test('obj is not generator', function (t) {
  t.equal(isGenerator({}), false)
  t.end()
})

test('function is not generator', function (t) {
  t.equal(isGenerator(function () {}), false)
  t.end()
})

test('null is not generator', function (t) {
  t.equal(isGenerator(null), false)
  t.end()
})

test('bool is not generator', function (t) {
  t.equal(isGenerator(true), false)
  t.end()
})
