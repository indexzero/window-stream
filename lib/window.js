/*
 * window.js: Weighted moving average, stdDev and percentiles.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var stream = require('stream'),
    util = require('util');

//
// ### function Window (options)
// #### @options {Object} Options for this instance
// ####   @options.fixed {boolean} Value indicating if this is a fixed window.
// Constructor function for the Window object containing base math for
// sets of events with `.metric` properties.
//
var Window = module.exports = function Window(options) {
  if (!(this instanceof Window)) { return new Window(options) }

  this.readable = true;
  this.writable = true;
  stream.Stream.call(this);
  options = options || {};

  this.data  = options.data || [];
  this.fixed = typeof options.fixed !== 'undefined'
    ? options.fixed
    : false;
};

//
// Inherit from `stream.Stream`.
//
util.inherits(Window, stream.Stream);

//
// ### @sum {number}
// Returns the sum of all `.metric` properties
// in `this.data`.
//
Window.prototype.sum = function () {
  return this.data.reduce(function (sum, data) {
    return sum + data.metric;
  }, 0);
};

//
// ### @median {number}
// Returns the median of all `.metric` properties
// in `this.data`.
//
Window.prototype.median = function () {
  return this.percentile(50);
};

//
// ### @mean {number}
// Returns the mean of all `.metric` properties
// in `this.data`.
//
Window.prototype.mean = function () {
  return this.data.length
    ? this.sum() / this.data.length
    : 0
};

//
// ### @variance {number}
// Returns the variance of all `.metric` properties
// in `this.data`.
//
Window.prototype.variance = function () {
  var mean = this.mean()

  return this.data.reduce(function (variance, data) {
    return variance + Math.pow(data.metric - mean, 2);
  }, 0) / this.data.length;
};

//
// ### @stdDev {number}
// Returns the standard deviation of all `.metric`
// properties in `this.data`.
//
Window.prototype.stdDev = function () {
  return Math.sqrt(this.variance());
};

//
// ### @sorted {Array}
// Returns the sorted set of all `.metric` properties
// in `this.data`.
//
Window.prototype.sorted = function () {
  return this.data
    .map(function (data) {
      return data.metric;
    })
    .sort(function (a, b) {
      return a - b;
    });
};

//
// ### function percentile (n)
// Returns the pth percentile of all `.metric`
// properties in `this.data` using linear interpolation
// of the pth rank.
//
Window.prototype.percentile = function (p) {
  if (!this.data.length) {
    return 0;
  }
  if (this.data.length == 1) {
    return this.data[0];
  }

  var rank   = this.rank(p) - 1,
      sorted = this.sorted(),
      floor  = Math.floor(rank - 1),
      ceil   = Math.ceil(rank + 1);

  //
  // If the index is 0 or `this.data.length` then respond
  // with that value
  //
  if (rank === 1 || rank === this.data.length) {
    return sorted[rank - 1];
  }

  //
  // Otherwise, ensure that the floor and ceil
  // are bounded
  //
  if (floor < 0) {
    floor = 0;
  }

  if (ceil >= this.data.length) {
    ceil = this.data.length - 1;
  }

  //
  // Calculate linear interpolation between two nearest ranks
  // <floor, sorted[floor]> and <ceil, sorted[ceil]> (i.e.
  // <x0, y0> and <x1, y1>) as:
  //
  //                       rank - x0
  // p = y0 + (y1 - y0) * -----------
  //                        x1 - x0
  //
  return sorted[floor] +
    ((sorted[ceil] - sorted[floor]) *
    ((rank - floor) / (ceil - floor)));
};

//
// ### function percentile (n)
// Returns the pth rank of all `.metric`
// properties in `this.data`.
//
Window.prototype.rank = function (p) {
  return (p / 100) * this.data.length + 0.5;
};

//
// ### function end (data)
// Emits the "end" event.
//
Window.prototype.end = function () {
  this.emit('end');
};
