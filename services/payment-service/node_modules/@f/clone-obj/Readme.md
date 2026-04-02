
# clone-obj

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Create a shallow copy of an object.

## Installation

    $ npm install @f/clone-obj

## Usage

```js
var cloneObj = require('@f/clone-obj')

cloneObj({a: 1, b: 'test'})
```

## API

### cloneObj(obj)

- `obj` - The object to be cloned

**Returns:** A new object, containing identical keys and values.

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/clone-obj.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/clone-obj
[git-image]: https://img.shields.io/github/tag/micro-js/clone-obj.svg
[git-url]: https://github.com/micro-js/clone-obj
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/clone-obj.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/clone-obj
