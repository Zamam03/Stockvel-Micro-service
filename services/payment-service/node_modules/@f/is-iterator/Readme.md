
# is-iterator

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Check if iterator.

## Installation

    $ npm install @f/is-iterator

## Usage

```js
var isIterator = require('@f/is-iterator')

isIterator((function * () {})()) // => true
```

## API

### isIterator(obj, strict)

- `obj` - object to check for iterator interface
- `strict` - when strict is true `throw` is required in addition to `next`

**Returns:** boolean indicating if iterator

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/is-iterator.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/is-iterator
[git-image]: https://img.shields.io/github/tag/micro-js/is-iterator.svg
[git-url]: https://github.com/micro-js/is-iterator
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/is-iterator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/is-iterator
