
# defer-promise

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Like Promise.defer(). Works the same ways as Promise.defer(), which isn't in the Promise spec and isn't always supported.

## Installation

    $ npm install @f/defer-promise

## Usage

```js
var deferPromise = require('@f/defer-promise')

var deferred = deferPromise()

deferred.promise.then(function (val) {
  console.log('woot ' + val)
})
deferred.resolve('yo')
// => "woot yo"

```

## API

### deferPromise()

**Returns:** `deferred`

### .promise

Promise object.

### .resolve

Resolve promise.

### .reject

Reject promise.

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/defer-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/defer-promise
[git-image]: https://img.shields.io/github/tag/micro-js/defer-promise.svg?style=flat-square
[git-url]: https://github.com/micro-js/defer-promise
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/defer-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/defer-promise
