
# is-defer

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Check if value looks like a defer.

## Installation

    $ npm install @f/is-defer

## Usage

```js
var isDefer = require('@f/is-defer')

isDefer(Promise.defer()) // => true
```

## API

### isDefer(val, strict)

- `val` - check if `val` is defer
- `strict` - requires resolve and reject if true

**Returns:** boolean

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/is-defer.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/is-defer
[git-image]: https://img.shields.io/github/tag/micro-js/is-defer.svg?style=flat-square
[git-url]: https://github.com/micro-js/is-defer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/is-defer.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/is-defer
