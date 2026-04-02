/**
 * Imports
 */

var toMiddleware = require('..')
var test = require('tape')
var bind = require('@f/bind-middleware')

/**
 * Tests
 */

test('should convert function to redux middleware', function (t) {

  var addOne = bind([toMiddleware(add)])

  t.equal(addOne(1), 2)
  t.end()

  function add (v) {
    return v + 1
  }
})
