/**
 * Imports
 */

var generator = require('..')
var test = require('tape')
var isIterable = require('@f/is-iterable')

/**
 * Tests
 */

test('generator should be iterable', function (t) {
  var obj = new generator.Object()
  t.equal(isIterable(obj), true)
  t.end()
})

test('generator to string should be generator', function (t) {
  var obj = new generator.Object()
  t.equal(String(obj), '[object Generator]')
  t.end()
})

test('generator prototype constructor should GeneratorFunction', function (t) {
  t.equal(generator.Object.prototype.constructor.constructor, generator.Function)
  t.end()
})

test('Generator Function should have correct names', function (t) {
  t.equal(generator.Function.name, 'GeneratorFunction')
  t.equal(generator.Function.displayName, 'GeneratorFunction')
  t.end()
})

test('GeneratorFunctionPrototype constructor should GeneratorFunction', function (t) {
  t.equal(generator.FunctionPrototype.constructor, generator.Function)
  t.end()
})
