/**
 * Imports
 */

var toPromise = require('..')
var test = require('tape')

test('should convert to promise', function (t) {
  toPromise(function * () {
    yield 1
    yield 2
    return 3
  }).then(function (res) {
    t.equal(res, 3)
    t.end()
  })
})

test('should resolve yieldeds', function (t) {
  toPromise(function * () {
    var res = yield Promise.resolve(1)
    res = yield Promise.resolve(res + 1)
    return res + 1
  }).then(function (res) {
    t.equal(res, 3)
    t.end()
  })
})

test('should catch rejected', function (t) {
  toPromise(function * () {
    try {
      yield Promise.reject(new Error('test'))
    } catch (err) {
      return 1
    }
  }).then(function (res) {
    t.equal(res, 1)
    t.end()
  })
})

test('should pass initial ags', function (t) {
  toPromise(function * (init) {
    var res = yield init
    res = yield Promise.resolve(res + 1)
    return res + 1
  }, 2).then(function (res) {
    t.equal(res, 4)
    t.end()
  })
})

test('should reject thrown erros in generator', function (t) {
  toPromise(function * () {
    throw new Error('foo')
  }).catch(function (err) {
    t.ok(err)
    t.end()
  })
})

test('should yield thunk', function (t) {
  var l = []
  function log (v) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        l.push(v)
        resolve(v + 1)
      })
    })
  }

  toPromise(function * () {
    var res = yield log(1)
    res = yield log(res)
    res = yield log(res)
  }).then(function () {
    t.deepEqual(l, [1, 2, 3])
    t.end()
  })
})

test('should resolve value', function (t) {
  toPromise(1).then(function (res) {
    t.equal(res, 1)
    t.end()
  })
})

test('should return promise when yielding defer', function (t) {
  toPromise(function * () {
    var d = Promise.defer()
    setTimeout(function () {
      d.resolve(1)
    }, 10)
    return yield yield d
  }).then(function (v) {
    t.equal(v, 1)
    t.end()
  })
})

test('should resolve return value', function (t) {
  toPromise(function *() {
    yield Promise.resolve(1)
    return Promise.resolve(2)
  }).then(function (val) {
    t.equal(val, 2)
    t.end()
  })
})
