/**
 * Imports
 */

var values = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should return values', function (t) {
  t.deepEqual(values({1: 1, 2: '2', foo: 'bar'}), [1, '2', 'bar'])
  t.end()
})
