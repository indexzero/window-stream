/*
 * window-sum.js :: Calculates a sum based on an internal window
 *
 * (C) 2013, Charlie Robbins
 *
 */

var util = require('util'),
    Window = require('./window');

//
// ### function WindowSum (window)
// #### @window {Window} Internal window instance
// Constructor function for the WindowSum object responsible for calculating
// the sum for fixed or continuous windows of events based on a given size
//
//
var WindowSum = module.exports = function WindowSum(window) {
  if (!(this instanceof WindowSum)) { return new WindowSum(window) }
  if(!(window instanceof Window)) {
    throw new Error('You must provide a window instance as argument');
  }
  Window.call(this);
  this.window = window;
};

//
// Inherit from Window
//
util.inherits(WindowSum, Window);

//
// ### function write(data)
// ### @data {Object} Data to write to the internal window for sum
// Writes the specified `data` to the internal window and then
// return the sum as its metric
//
WindowSum.prototype.write = function (data) {
  //
  // Write data to the internal window and calculate the sum over the window
  //
  this.window.write(data);
  this.last = Object.keys(data).reduce(function (all, key) {
    all[key] = data[key];
    return all;
  }, {});

  this.last.metric = this.window.sum();

  //
  // Emit the sum of the data returned from the internal window
  //
  this.emit('data', this.last);
};
