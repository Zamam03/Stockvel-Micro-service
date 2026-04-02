/**
 * Expose toMiddleware
 */

module.exports = toMiddleware

/**
 * toMiddleware
 */

function toMiddleware (fn, type) {
  return function (ctx) {
    return function (next) {
      return function (action) {
        if (type) {
          return action.type === type ? fn(action.payload) : next(action)
        } else {
          return next(fn(action))
        }
      }
    }
  }
}
