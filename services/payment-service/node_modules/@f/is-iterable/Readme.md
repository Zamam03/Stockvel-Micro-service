
# is-iterable

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Check if iterable.

## Installation

    $ npm install @f/is-iterable

## Usage

```js
var isIterable = require('@f/is-iterable')

isIterable('foo') // => true
isIterable([1, 2, 3]) // => true
isIterable(1) // => false
```

## API

### isIterable(obj)

- `obj` - Object to check if iterable.

**Returns:** Boolean indicating iterable.

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/is-iterable.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/is-iterable
[git-image]: https://img.shields.io/github/tag/micro-js/is-iterable.svg
[git-url]: https://github.com/micro-js/is-iterable
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/is-iterable.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/is-iterable
