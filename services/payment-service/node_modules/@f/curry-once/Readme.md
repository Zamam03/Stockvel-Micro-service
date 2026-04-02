
# curry-once

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Simple curry function.

## Installation

    $ npm install @f/curry-once

## Usage

```js
var curry = require('@f/curry-once')

var add = curry(function (a, b) {
  return a + b
})

var addOne = add(1)
addOne(1) // => 2

```

## API

### curry(fn)

- `fn` - function to curry

**Returns:** curried partial of `fn`

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/curry-once.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/curry-once
[git-image]: https://img.shields.io/github/tag/micro-js/curry-once.svg?style=flat-square
[git-url]: https://github.com/micro-js/curry-once
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/curry-once.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/curry-once
