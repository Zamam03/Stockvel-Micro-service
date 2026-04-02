
# is-generator

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Check if generator.

## Installation

    $ npm install @f/is-generator

## Usage

```js
var isGenerator = require('@f/is-generator')

isGenerator(function * () {
  yield 1
}) // => true
```

## API

### isGenerator(obj)

- `obj` - object to test

**Returns:** boolean

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/is-generator.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/is-generator
[git-image]: https://img.shields.io/github/tag/micro-js/is-generator.svg
[git-url]: https://github.com/micro-js/is-generator
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/is-generator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/is-generator
