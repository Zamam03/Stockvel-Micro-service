/**
 * Imports
 */

var zipObj = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should zip keys and values', function (t) {
  t.deepEqual(zipObj([1, 3, 2], [1, 3, 2]), {1: 1, 3: 3, 2: 2})
  t.end()
})
