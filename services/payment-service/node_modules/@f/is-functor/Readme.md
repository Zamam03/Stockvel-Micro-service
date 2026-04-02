
# is-functor

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Check if looks like a functor (implments map).

## Installation

    $ npm install @f/is-functor

## Usage

```js
var isFunctor = require('@f/is-functor')

isFunctor([]) // => true
isFunctor({}) // => false
isFunctor(Object.create({map: function () {}})) // => true
```

## API

### isFunctor(ob)

- `obj` - object to check

**Returns:** boolean indicating whether `obj` is a functor

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/is-functor.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/is-functor
[git-image]: https://img.shields.io/github/tag/micro-js/is-functor.svg
[git-url]: https://github.com/micro-js/is-functor
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/is-functor.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/is-functor
