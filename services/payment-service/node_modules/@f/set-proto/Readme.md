
# set-proto

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Set the proto of an object.

## Installation

    $ npm install @f/set-proto

## Usage

```js
var setProto = require('@f/set-proto')

var man = {talk: () => 'hello'}
var cat = {talk: () => 'meow'}
var obj = {}

setProto(man, obj)
obj.talk() // => 'hello'
setProto(cat, obj)
obj.talk() // => 'meow'
```

## API

### setProto(proto, obj)

- `proto` - The object's new prototype.
- `obj` - The object which is to have its prototype set.

**Returns:** `obj`

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/set-proto.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/set-proto
[git-image]: https://img.shields.io/github/tag/micro-js/set-proto.svg
[git-url]: https://github.com/micro-js/set-proto
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/set-proto.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/set-proto
