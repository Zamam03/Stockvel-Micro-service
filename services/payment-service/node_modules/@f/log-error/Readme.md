
# log-error

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Log error in a nicely formatted way

## Installation

    $ npm install @f/log-error

## Usage

```js
var logError = require('@f/log-error')

fetchUser().then(storeUser, logError)
```

## API

### logError(error)

- `error` - An error object

**Returns:** `void`

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/log-error.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/log-error
[git-image]: https://img.shields.io/github/tag/micro-js/log-error.svg?style=flat-square
[git-url]: https://github.com/micro-js/log-error
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/log-error.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/log-error
