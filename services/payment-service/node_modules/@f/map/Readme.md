
# map

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Map a function over a container of some kind

## Installation

    $ npm install @f/map

## Usage

```js
var map = require('@f/map')

map(add1, [1, 2, 3])          // => [2, 3, 4]
map(add1, {a: 1, b: 2, c: 3}) // => {a: 2, b: 3, c: 4}
map(add1, function * () {yield 1; yield 2; yield 3}) // => function * () {yield 2; yield 3; yield 4}

function add1 (n) {
  return n + 1
}
```

## API

### map(fn, container)

- `fn` - The function to map over val. Accepts `(val, key)` and returns a new `val` to be set at `key`.
- `container` - A container of some kind (objects, arrays, generators or functors).

**Returns:** A new entity of the same type as `container` with all of its values being replaced by the result of `fn(val, key)`.

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/map.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/map
[git-image]: https://img.shields.io/github/tag/micro-js/map.svg
[git-url]: https://github.com/micro-js/map
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/map.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/map
