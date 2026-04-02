/**
 * Imports
 */

var curry = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should curry fn', function (t) {
  var add = curry(function (a, b) {
    return a + b
  })

  var addOne = add(1)

  t.equal(addOne(1), 2)
  t.equal(addOne(2), 3)
  t.end()
})
