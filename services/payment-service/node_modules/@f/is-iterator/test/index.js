/**
 * Imports
 */

var isIterator = require('..')
var test = require('tape')

/**
 * Tests
 */

test('generator obj should be iterator', function (t) {
  t.equal(isIterator((function * () {})()), true)
  t.end()
})

test('generator obj should be iterator', function (t) {
  t.equal(isIterator([][Symbol.iterator]()), true)
  t.end()
})

test('obj with next should be iterator', function (t) {
  t.equal(isIterator({next: function () {}}), true)
  t.end()
})

test('obj with next and throw should be iterator', function (t) {
  t.equal(isIterator({next: function () {}, throw: function () {}}), true)
  t.end()
})

test('obj with next, throw, and result should be iterator', function (t) {
  t.equal(isIterator({next: function () {}, throw: function () {}, result: function () {}}), true)
  t.end()
})

test('obj should not be iterator', function (t) {
  t.equal(isIterator({}), false)
  t.end()
})

test('strict obj with only next should not be iterator', function (t) {
  t.equal(isIterator({next: function () {}}, true), false)
  t.end()
})

test('obj with just throw should not be iterator', function (t) {
  t.equal(isIterator({throw: function () {}}), false)
  t.end()
})

test('obj with next and throw bool should not be iterator', function (t) {
  t.equal(isIterator({next: function () {}, throw: true}), false)
  t.end()
})

test('obj with next and throw bool should not be iterator', function (t) {
  t.equal(isIterator({next: function () {}, throw: true}), false)
  t.end()
})

test('obj non valid keys should be iterator', function (t) {
  t.equal(isIterator({next: function () {}, _invoke: function () {}}), true)
  t.end()
})
