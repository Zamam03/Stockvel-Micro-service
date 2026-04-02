
# iterator-symbol

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

The iterator symbol.

## Installation

    $ npm install @f/iterator-symbol

## Usage

```js
var iteratorSymbol = require('@f/iterator-symbol')

var myIterable = {}
myIterable[iteratorSymbol] = function * () {
    yield 1;
    yield 2;
    yield 3;
}
Array.from(myIterable) // [1, 2, 3]
```

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/iterator-symbol.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/iterator-symbol
[git-image]: https://img.shields.io/github/tag/micro-js/iterator-symbol.svg
[git-url]: https://github.com/micro-js/iterator-symbol
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/iterator-symbol.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/iterator-symbol
