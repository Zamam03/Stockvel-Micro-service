
# yoco

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Your custom co routines. Use redux middleware to define custom yield behavior, using [redux-flo](//github.com/redux-effects/redux-flo) for control flow.

## Installation

    $ npm install yoco

## Usage

```js
import yoco from 'yoco'
import rlog from 'redux-log'

let arr = []
let log = yoco(rlog(arr))

log(function * () {
  yield 'hello'
  yield 'world'
})

arr // => ['hello', 'world']

```

## API

### yoco(mw)

- `mw` - redux middleware or array of middleware

**Returns:** a custom co routine runner

### map(fns)

- `fns` - functions to perform left to right composition over

**Returns:** a custom co routine runner

```js

import {map} from 'yoco'
let wacky = map(wackify)

wacky(function * () {
  yield 'happy' // => 'wacky happy'
  yield ['dog', 'cat'] // => ['wacky dog', 'wacky cat']
})

function wackify (str) {
  return 'wacky ' + str
}
```

## License

MIT

[travis-image]: https://img.shields.io/travis/floxjs/yoco.svg?style=flat-square
[travis-url]: https://travis-ci.org/floxjs/yoco
[git-image]: https://img.shields.io/github/tag/floxjs/yoco.svg?style=flat-square
[git-url]: https://github.com/floxjs/yoco
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/yoco.svg?style=flat-square
[npm-url]: https://npmjs.org/package/yoco
