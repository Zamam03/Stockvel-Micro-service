/**
 * Imports
 */

var isDefer = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should return true for defer', function (t) {
  t.ok(isDefer(Promise.defer()))
  t.end()
})

test('should return true if deferish', function (t) {
  t.ok(isDefer({promise: Promise.defer().promise}))
  t.end()
})

test('should return false for deferish if strict', function (t) {
  t.notOk(isDefer({promise: Promise.defer().promise}, true))
  t.end()
})

test('should return false for non defers', function (t) {
  t.notOk(isDefer({}))
  t.notOk(isDefer())
  t.notOk(isDefer('woot'))
  t.notOk(isDefer(1))
  t.notOk(isDefer(Promise.defer().promise))
  t.notOk(isDefer({promise: true}))
  t.end()
})
