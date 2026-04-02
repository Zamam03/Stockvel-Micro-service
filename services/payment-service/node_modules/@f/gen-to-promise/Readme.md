
# gen-to-promise

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Convert generator to promise.

## Installation

    $ npm install @f/gen-to-promise

## Usage

```js
var genToPromise = require('@f/gen-to-promise')

genToPromise(function * () {
  var students = yield fetch('/students').then((res) => res.json())
  var studentIds = students.map((student) => student.id)
  var teachers = yield fetch('/teachers.of', {body: {students: studentIds}}).then((res) => res.json())
  return teachers
}).then(function (teachers) {
  // teachers of students
})

```

## API

### genToPromise(gen)

- `gen` - generator

**Returns:** a promise with all the "yieldeds" in `gen` resolved

## License

MIT

[travis-image]: https://img.shields.io/travis/micro-js/gen-to-promise.svg?style=flat-square
[travis-url]: https://travis-ci.org/micro-js/gen-to-promise
[git-image]: https://img.shields.io/github/tag/micro-js/gen-to-promise.svg?style=flat-square
[git-url]: https://github.com/micro-js/gen-to-promise
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/@f/gen-to-promise.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@f/gen-to-promise
