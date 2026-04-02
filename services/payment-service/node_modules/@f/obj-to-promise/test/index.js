/**
 * Imports
 */

var objectToPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should resolve obj', function (t) {
  objectToPromise({
    1: 1,
    2: Promise.resolve(2)
  }).then(function (obj) {
    t.deepEqual(obj, {1: 1, 2: 2})
    t.end()
  })
})

test('should resolve only when all have resolved', function (t) {
  var start = +new Date()
  objectToPromise({
    1: 1,
    2: wait(2, 100),
    3: wait(3, 200)
  }).then(function (obj) {
    t.ok(new Date() - start > 200)
    t.deepEqual(obj, {1: 1, 2: 2, 3: 3})
    t.end()
  })
})

function wait (val, timeout) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(val)
    }, timeout)
  })
}
