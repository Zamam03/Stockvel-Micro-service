
# slice

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Shallow copy of array or portion of array.

## Installation

    $ npm install @f/slice

## Usage

```js
var slice = require('@f/slice')

slice([1, 2], 1) // => 2
```

## API

### slice(array, begin, end)

- `array` - source array
- `begin` - beginning of copy
- `end` - end of copy

**Returns:** copy of array

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/slice.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/slice
[git-image]: https://img.shields.io/github/tag/micro-js/slice.svg?style=flat-square
[git-url]: https://github.com/micro-js/slice
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/slice.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/slice
