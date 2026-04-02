
# obj-to-promise

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Convert an object to a promise.

## Installation

    $ npm install @f/obj-to-promise

## Usage

```js
var objectToPromise = require('@f/obj-to-promise')

objectToPromise({
  1: Promise.resolve(1),
  2: Promise.resolve(2)
}).then(function (obj) {
  console.log(obj) // => { 1: 1, 2: 2 }
})

```

## API

### objectToPromise(object)

- `object` - an object of "resolavables"

**Returns:** a promise

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/obj-to-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/obj-to-promise
[git-image]: https://img.shields.io/github/tag/micro-js/obj-to-promise.svg
[git-url]: https://github.com/micro-js/obj-to-promise
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/obj-to-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/obj-to-promise
