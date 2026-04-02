/**
 * Imports
 */

var map = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should map array', function (t) {
  t.deepEqual(map(addOne, [1, 2]), [2, 3])
  t.end()

  function addOne (v) {
    return v + 1
  }
})
