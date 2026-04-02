/**
 * Imports
 */

var logError = require('..')
var stderr = require('test-console').stderr
var test = require('tape')

/**
 * Tests
 */

test('should work', function (t) {
  var inspect = stderr.inspect()

  logError(new Error('some weird string'))
  inspect.restore()

  var str = inspect.output.join('\n')
  t.ok(str.indexOf('some weird string') !== -1)

  t.end()
})
