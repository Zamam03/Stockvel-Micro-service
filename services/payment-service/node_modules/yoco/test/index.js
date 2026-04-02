/**
 * Imports
 */

import test from 'tape'
import yoco, {map, composable} from '../src'
import rlog from 'redux-log'

/**
 * Tests
 */

test('should work', (t) => {
  let l = []
  let log = yoco(rlog(l))
  log(function * () {
    yield 'hello'
    yield 'world'
  })
  t.deepEqual(l, ['hello', 'world'])
  t.end()
})

test('should wrap', (t) => {
  let l = []
  let log = yoco(rlog(l))
  let hello = log.wrap(function * () {
    yield 'hello'
    yield 'world'
  })
  t.deepEqual(l, [])
  hello()
  t.deepEqual(l, ['hello', 'world'])
  t.end()
})

test('should work as array', (t) => {
  let l = []
  let log = yoco([rlog(l)])
  log(function * () {
    yield 'hello'
    yield 'world'
  })
  t.deepEqual(l, ['hello', 'world'])
  t.end()
})

test('should create mapping generator', (t) => {

  let wacky = map(wackify)

  wacky(function * () {
    let wackyHappy = yield 'happy'
    let wackyParallel = yield ['dog', 'cat']
    t.equal(wackyHappy, 'wacky happy')
    t.deepEqual(wackyParallel, ['wacky dog', 'wacky cat'])
    t.end()
  })

  function wackify (str) {
    return 'wacky ' + str
  }

})

test('should compose with gen', (t) => {
  t.plan(3)
  var localLog = []
  var localCo = composable([
    ctx => next => action => {
      if (action.type === 'LOG') {
        localLog.push(action.payload)
      } else {
        return next(action)
      }
    }
  ])

  let l = []
  let co = yoco(rlog(l))

  co(localCo(process)).then(function (res) {
    t.equal(res, 'done')
    t.deepEqual(l, ['foo', 'bar'])
    t.deepEqual(localLog, [1, 2, 3])
  })

  function * process () {
    yield {type: 'LOG', payload: 1}
    yield 'foo'
    yield {type: 'LOG', payload: 2}
    yield 'bar'
    yield {type: 'LOG', payload: 3}
    return 'done'
  }

})

test('should throw err in composed', (t) => {
  t.plan(3)
  var localLog = []
  var localCo = composable([
    ctx => next => action => {
      if (action.type === 'LOG') {
        localLog.push(action.payload)
      } else {
        return next(action)
      }
    }
  ])

  let l = []
  let co = yoco(rlog(l))

  co.onError = function (err) {
    t.equal(err.message, 'stop')
    t.deepEqual(l, ['foo', 'bar'])
    t.deepEqual(localLog, [1, 2])
  }

  co(localCo(process))

  function * process () {
    yield {type: 'LOG', payload: 1}
    yield 'foo'
    yield {type: 'LOG', payload: 2}
    yield 'bar'
    throw new Error('stop')
  }

})
