/**
 * Imports
 */

var iteratorSymbol = require('@f/iterator-symbol')

/**
 * Expose generator
 */

exports.Object = Generator
exports.Function = GeneratorFunction
exports.FunctionPrototype = GeneratorFunctionPrototype

/**
 * Generator
 */

function Generator () {}
function GeneratorFunction () {}
function GeneratorFunctionPrototype () {}

var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype
GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype
GeneratorFunctionPrototype.constructor = GeneratorFunction
GeneratorFunction.displayName = 'GeneratorFunction'

Gp[iteratorSymbol] = function () {
  return this
}

Gp.toString = function () {
  return '[object Generator]'
}
