/**
 * Expose slice
 */

module.exports = slice

/**
 * slice
 */

function slice (array, begin, end) {
  begin = begin || 0
  end = end || array.length

  var arr = new Array(array.length)
  for (var i = begin; i < end; ++i) {
    arr[i - begin] = array[i]
  }
  return arr
}
