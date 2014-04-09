/*
 * moving-average.js: Calculates a moving average of various types based on an internal window.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var util = require('util'),
    Stream = require('stream').Stream,
    EventWindow = require('./event-window'),
    TimeWindow = require('./time-window');

// Default Alpha Constants
var M1_ALPHA = 1 - Math.exp(-5/60);

//
// ### function MovingAverage (options)
// #### @options {Object} Options for this instance
// ####   @options.size     {number} Number of events to store in this instance.
// ####   @options.duration {number} Timespan over which to store events in this instance.
// ####   @options.average {string|Object} Details of the averaging algorithm to use.
// ####   @options.type {string} Alternative to options.average.type
// Constructor function for the MovingAverage object responsible for calculating
// various moving averages for fixed or continuous windows of events based on a
// given size.
//
var MovingAverage = module.exports = function MovingAverage(options) {
  if (!(this instanceof MovingAverage)) { return new MovingAverage(options) }
  options = options || {};

  this.readable = true;
  this.writable = true;
  Stream.call(this);

  //
  // Average type
  //
  if (options.average) {
    if (typeof options.average === 'string') {
      this.average = { type: options.average };
    }
    else {
      this.average = options.average;
    }
  }
  if (!this.average && options.type) {
    this.average = { type: options.type };
  }

  //
  // Set up a window if necessary
  //
  if (this.average.type !== 'exponential') {

    //
    // Either size or duration, but not both
    //
    if (typeof options.size !== 'undefined') {
      this.size = options.size;
      this.window = new EventWindow({ size: this.size });
    }
    else if (typeof options.duration !== 'undefined') {
      this.duration = options.duration;
      this.window = new TimeWindow({ duration: this.duration });
    }
    else if (typeof options.window  !== 'undefined' && typeof options.window !== 'function') {
      this.window = options.window;
    }
    else if (typeof options.window  !== 'undefined' && typeof options.window === 'function') {
      this.window = options.window();
    }
    else {
      throw new Error('average type ' + this.average.type + ' requires either options.size or options.duration');
    }
    if (typeof this.size !== 'undefined' && typeof this.duration !== 'undefined') {
      throw new Error('options.size and options.duration are mutually exclusive.');
    }
  }
};
util.inherits(MovingAverage, Stream);

//
// ### function write (data)
// #### @data {Object} Data to write to this average.
// Emits `data` with the calculated average.
//
MovingAverage.prototype.write = function (data) {
  //
  // Write the data to the internal window if there is one
  //
  if (this.window) {
    this.window.write(data);
  }

  this.last = clone(data);

  //
  // Remark: This all assumes you're dealing with a godot-stream, meaning
  // that "metric" gets overwritten with the average metric.
  //
  this.last.metric = this.calculate(data);
  this.last.meta   = this.last.meta || {};

  //
  // Recall that EWMAs do not have a window
  // TODO: Implement exponentially weighted moving variance and EWMSD
  //
  if (this.window) {
    this.last.meta.variance = this.window.variance();
    this.last.meta.stdDev   = this.window.stdDev();
  }

  //
  // Emit the average of the data using the specified
  // algorithm associated with this instance.
  //
  this.emit('data', this.last);
};

//
// Clone helper
//
function clone(a) {
  return Object.keys(a).reduce(function (b, k) {
    b[k] = a[k];
    return b;
  }, {});
}

//
// ### function calculate (data)
// #### @data {Object} Data to write to this average.
// Returns the average for the specified algorithm
// associated with this instance.
//
MovingAverage.prototype.calculate = function (data) {
  switch (this.average.type) {
    case 'simple':      return this.simpleAverage(data);
    case 'weighted':    return this.weightedAverage(data);
    case 'exponential': return this.exponentialAverage(data);
    default: throw new Error('Invalid average type: ' + this.average.type);
  }
};

//
// ### function simpleAverage (data)
// #### @data {Object} Data to write to this average.
// Returns a simple moving average for the internal window.
//
MovingAverage.prototype.simpleAverage = function (data) {
  return this.window.mean();
};

//
// ### function weightedAverage ()
// Returns a weighted moving average for the internal window.
//
MovingAverage.prototype.weightedAverage = function (data) {
  var length = this.window.data.length,
      diff   = 10 - length,
      self   = this;

  return this.window.data.reduce(function (avg, data, i) {
    return avg + (data.metric * self.average.weights[i + diff]);
  }, 0) / ((length * (length + 1)) / 2) ;
};

//
// ### function exponentialAverage (data)
// #### @data {Object} Data to write to this average.
// Returns an exponential weighted moving average for the
// internal window.
//
MovingAverage.prototype.exponentialAverage = function (data) {
  var alpha = this.average.alpha || M1_ALPHA;

  if (!this.last) {
    return data.metric;
  }

  return (alpha * data.metric) +
    (1 - alpha * this.last.metric);
};

//
// ### function end ()
// Emits the 'end' event
//
MovingAverage.prototype.end = function () {
  this.emit('end');
};
