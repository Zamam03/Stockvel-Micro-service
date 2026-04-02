
# to-promise

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Convert container to promise.

## Installation

    $ npm install @f/to-promise

## Usage

```js
var toPromise = require('@f/to-promise')

toPromise({
  a: Promise.resolve(1)
}).then(function (res) {
  res // => {a: 1}
})

toPromise([1]).then(function (res) {
  res // => [1]
})
```

## API

### toPromise(container)

- `container` - A container of some kind to convert (array, object, generator, or thunk)

**Returns:** a promise

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/to-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/to-promise
[git-image]: https://img.shields.io/github/tag/micro-js/to-promise.svg
[git-url]: https://github.com/micro-js/to-promise
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/to-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/to-promise
