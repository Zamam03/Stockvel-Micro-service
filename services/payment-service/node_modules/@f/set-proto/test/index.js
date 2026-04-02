/**
 * Imports
 */

var setProto = require('..')
var test = require('tape')

/**
 * Tests
 */

test('should set prototype', function (t) {
  var obj = {}
  var proto = {next: function () {
    return 'next'
  }}
  setProto(proto, obj)
  t.equal(obj.__proto__, proto)
  t.equal(obj.next(), 'next')
  t.end()
})

test('ie <= 10 polyfill', function (t) {
  var obj = Object.create(null)
  var proto = {t: 1}

  setProto(proto, obj)
  t.equal(obj.t, 1)
  t.deepEqual(Object.keys(obj), ['t'])

  t.end()
})
