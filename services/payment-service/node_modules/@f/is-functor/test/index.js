/**
 * Imports
 */

var isFunctor = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should return true for array', function (t) {
  t.equal(isFunctor([]), true)
  t.end()
})

test('should return false for obj', function (t) {
  t.equal(isFunctor({}), false)
  t.end()
})
