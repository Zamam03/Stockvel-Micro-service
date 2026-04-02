/**
 * Imports
 */

var thunkToPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should resolve thunk', function (t) {
  thunkToPromise(thunk).then(function (res) {
    t.equal(res, 1)
    t.end()
  })

  function thunk (cb) {
    setTimeout(function () {
      cb(null, 1)
    })
  }
})

test('should catch thunk error', function (t) {
  thunkToPromise(thunk).catch(function (err) {
    t.equal(err, 1)
    t.end()
  })

  function thunk (cb) {
    setTimeout(function () {
      cb(1)
    })
  }
})
