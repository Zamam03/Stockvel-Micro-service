/**
 * Imports
 */

var iteratorSymbol = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should be iterator symbol', function (t) {
  t.equal(iteratorSymbol, Symbol.iterator)
  t.end()
})
