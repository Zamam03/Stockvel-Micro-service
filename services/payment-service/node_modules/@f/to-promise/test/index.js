/**
 * Imports
 */

var toPromise = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should convert promise to equivalent promise', function (t) {
  var p = Promise.resolve(1)
  t.equal(p, toPromise(p))
  t.end()
})

test('should convert array of promises to resolved array', function (t) {
  toPromise([Promise.resolve(1), Promise.resolve(2)]).then(function (res) {
    t.deepEqual(res, [1, 2])
    t.end()
  })
})

test('should convert object of promises to resolved object', function (t) {
  toPromise({a: Promise.resolve(1), b: Promise.resolve(2)}).then(function (res) {
    t.deepEqual(res, {a: 1, b: 2})
    t.end()
  })
})

test('should convert generator to resolved res', function (t) {
  toPromise(function * () {
    var res = yield Promise.resolve(1)
    return yield Promise.resolve(res + 1)
  }).then(function (res) {
    t.equal(res, 2)
    t.end()
  })
})

test('should convert generator obj to resolved res', function (t) {
  toPromise(function * () {
    var res = yield Promise.resolve(1)
    return yield Promise.resolve(res + 1)
  } ()).then(function (res) {
    t.equal(res, 2)
    t.end()
  })
})

test('should convert thunk to resolved res', function (t) {
  toPromise(function(cb) {
    cb(null, 1)
  }).then(function (res) {
    t.equal(res, 1)
    t.end()
  })
})

test('should resolve number', function (t) {
  toPromise(1).then(function(res) {
    t.equal(res, 1)
    t.end()
  })
})
