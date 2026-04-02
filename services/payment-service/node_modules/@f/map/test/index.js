/**
 * Imports
 */

var map = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should work with arrays, objects, generators, and iterators', function (t) {
  t.deepEqual(map(add1, [1, 2, 3]), [2, 3, 4])
  t.deepEqual(map(add1, {a: 1, b: 2, c: 3}), {a: 2, b: 3, c: 4})
  t.deepEqual(Array.from(map(add1, function * () {yield 1; yield 2; yield 3})()), [2, 3, 4])
  t.deepEqual(Array.from(map(add1, function * () {yield 1; yield 2; yield 3} ())()), [2, 3, 4])
  t.end()
})

test('should work with functor', function (t) {
  var f = new Functor([1, 2, 3])
  t.deepEqual(map(add1, f), [2, 3, 4])
  t.end()
})

test('should throw undefined', function (t) {
  t.throws(function () {
    map(add1)
  })
  t.end()
})

function add1 (n) {
  return n + 1
}

function Functor (data) {
  this.data = data
}

Functor.prototype.map = function (fn) {
  return this.data.map(fn)
}
