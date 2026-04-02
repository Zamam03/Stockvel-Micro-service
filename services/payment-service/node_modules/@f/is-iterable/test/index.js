/**
 * Imports
 */

var isIterable = require('..')
var test = require('tape')

/**
 * Tests
 */

test('string should be iterable', function (t) {
  t.equal(isIterable('hello world'), true)
  t.end()
})

test('array should be iterable', function (t) {
  t.equal(isIterable([1, 2, 3]), true)
  t.end()
})

test('number should not be iterable', function (t) {
  t.equal(isIterable(1), false)
  t.end()
})
