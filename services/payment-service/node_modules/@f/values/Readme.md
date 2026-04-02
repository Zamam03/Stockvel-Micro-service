
# values

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Get the array of values for an object.

## Installation

    $ npm install @f/values

## Usage

```js
var values = require('@f/values')

values({1: 1, 2: 2}) // [1, 2]
```

## API

### values(obj)

- `obj` - object to convert

**Returns:** values in `obj`

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/values.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/values
[git-image]: https://img.shields.io/github/tag/micro-js/values.svg
[git-url]: https://github.com/micro-js/values
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/values.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/values
