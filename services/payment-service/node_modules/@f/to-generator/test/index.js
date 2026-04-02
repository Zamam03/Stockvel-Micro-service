/**
 * Imports
 */

var toGenerator = require('..')
var test = require('tape')
var isGenerator = require('@f/is-generator')
var isGeneratorObject = require('@f/is-generator-object')

/**
 * Tests
 */

test('should convert iterator constructor into generator', function (t) {
  t.equal(isGenerator(toGenerator(function () {})), true)
  t.end()
})

test('should leave generator as generator', function (t) {
  t.equal(isGenerator(toGenerator(function * () {})), true)
  t.end()
})

test('generator should produce generator object', function (t) {
  var gen = toGenerator(function () {
    this.next = next
    this.throw = error

    function next () {
      return 'next'
    }

    function error () {
      return 'throw'
    }
  })

  t.equal(isGeneratorObject(gen()), true)
  t.end()
})

test('should get args', function (t) {
  var gen = toGenerator(function (arg1, arg2) {
    this.next = next

    function next () {
      return [arg1, arg2]
    }

  })

  t.deepEqual(gen(1, 2).next(), [1, 2])
  t.end()
})
