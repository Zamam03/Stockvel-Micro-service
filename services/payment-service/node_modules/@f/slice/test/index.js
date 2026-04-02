/**
 * Imports
 */

var slice = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should slice arguments', function (t) {
  t.deepEqual(toArray(1, 2), [1, 2])
  t.end()

  function toArray () {
    return slice(arguments)
  }
})

test('should slice subarray', function (t) {
  t.deepEqual(slice([1, 2], 1), [2])
  t.end()
})
