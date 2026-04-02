
# map-array

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Map array.

## Installation

    $ npm install @f/map-array

## Usage

```js
var map = require('@f/map-array')

map(addOne, [1, 2]) //  => [2, 3]

function addOne (v) {
  return v + 1
}

```

## API

### mapArray(fn, array)

- `fn` - mapping function
- `array` - array to map over

**Returns:** mapped array

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/map-array.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/map-array
[git-image]: https://img.shields.io/github/tag/micro-js/map-array.svg
[git-url]: https://github.com/micro-js/map-array
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/map-array.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/map-array
