/**
 * Imports
 */

var toPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should resolve array of promises', function (t) {
  toPromise([Promise.resolve(1), Promise.resolve(2)]).then(function (res) {
    t.deepEqual(res, [1, 2])
    t.end()
  })
})

test('should resolve array of mixed', function (t) {
  toPromise([1, Promise.resolve(2)]).then(function (res) {
    t.deepEqual(res, [1, 2])
    t.end()
  })
})
