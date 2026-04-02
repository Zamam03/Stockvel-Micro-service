
# array-to-promise

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Convert array to a promise.

## Installation

    $ npm install @f/array-to-promise

## Usage

```js
var arrayToPromise = require('@f/array-to-promise')

arrayToPromise([1, Promise.resolve(2)]).then(function (res) {
  res // => [1, 2]
})

```

## API

### arrayToPromise(array)

- `array` - array of promises and non-promises

**Returns:** array with all promises resolved

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/array-to-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/array-to-promise
[git-image]: https://img.shields.io/github/tag/micro-js/array-to-promise.svg
[git-url]: https://github.com/micro-js/array-to-promise
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/array-to-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/array-to-promise
