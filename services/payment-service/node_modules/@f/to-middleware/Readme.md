
# to-middleware

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Convert a function redux style middleware.

## Installation

    $ npm install @f/to-middleware

## Usage

```js
var toMiddleware = require('@f/to-middleware')
var bind = require('@f/bind-middleware')

var addOne = bind([toMiddleware(add)])

addOne(1) // => 2

function add (v) {
  return v + 1
}

```

## API

### toMiddleware(fn, type)

- `fn` - unary function to use in middleware
- `type` - type to match on - if matched payload is passed to fn - if not present action is passed to fn

**Returns:**

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/to-middleware.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/to-middleware
[git-image]: https://img.shields.io/github/tag/micro-js/to-middleware.svg
[git-url]: https://github.com/micro-js/to-middleware
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/to-middleware.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/to-middleware
