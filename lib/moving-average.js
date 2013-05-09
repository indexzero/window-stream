/*
 * moving-average.js: Calculates a moving average of various types based on an internal window.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var util = require('util'),
    Window = require('./window');

// Default Alpha Constants
var M1_ALPHA = 1 - Math.exp(-5/60);

//
// ### function MovingAverage (options)
// #### @options {Object} Options for this instance
// ####   @options.size    {number}        Number of events to store in this instance.
// ####   @options.window  {Object}        Value indicating if this is a fixed window.
// ####   @options.average {string|Object} Details of the averaging algorithm to use.
// Constructor function for the MovingAverage object responsible for calculating
// various moving averages for fixed or continuous windows of events based on a
// given size.
//
var MovingAverage = module.exports = function MovingAverage(options) {
  if (!options || !options.window || !options.average) {
    throw new Error('options.size, options.window, and options.average are required.');
  }

  Window.call(this, options);
  this.data    = [];
  this.window  = options.window;
  this.average = typeof options.average === 'string'
    ? { type: options.average }
    : options.average;
};

//
// Inherit from Window.
//
util.inherits(MovingAverage, Window);

//
// ### function write (data)
// #### @data {Object} Data to write to this average.
// Writes the specified `data` to the internal window
// and emits `data` with the calculated average.
//
MovingAverage.prototype.write = function (data) {
  //
  // Write the data to the internal window and
  // calculate the window average.
  //
  this.window.write(data);
  this.last = Object.keys(data).reduce(function (all, key) {
    all[key] = data[key];
    return all;
  }, {});

  this.last.metric = this.calculate(data);
  this.last.meta   = this.last.meta || {};

  this.last.meta.variance = this.window.variance;
  this.last.meta.stdDev   = this.window.stdDev;

  //
  // Emit the average of the data using the specified
  // algorithm associated with this instance.
  //
  this.emit('data', this.last);
};

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
  return this.window.mean;
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
