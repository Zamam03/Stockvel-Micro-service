/**
 * Imports
 */

var cloneObj = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should work', function (t) {
  var a = {a: 1}
  var b = cloneObj(a)

  t.equal(b.a, a.a)
  t.equal(Object.keys(a).length, Object.keys(b).length)
  t.notEqual(a, b)
  t.end()
})
