
# zip-obj

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Create an object from a list of keys and values.

## Installation

    $ npm install @f/zip-obj

## Usage

```js
var zipObj = require('@f/zip-obj')

zipObj([1, 2], [1, 2]) // => {1: 1, 2: 2}
```

## API

### zipObj(keys, values)

- `keys` - list of keys for new object
- `values` - list of values for new object

**Returns:** object with `keys` and `values`

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/zip-obj.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/zip-obj
[git-image]: https://img.shields.io/github/tag/micro-js/zip-obj.svg
[git-url]: https://github.com/micro-js/zip-obj
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/zip-obj.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/zip-obj
