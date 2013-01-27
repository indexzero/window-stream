/*
 * event-window.js: Window of events over a fixed size.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var util = require('util'),
    Window = require('./window');

//
// ### function EventWindow (options)
// #### @options {Object} Options for this instance
// ####   @options.size  {number}  Number of events to store in the Window.
// ####   @options.fixed {boolean} Value indicating if this is a fixed window.
// Constructor function for the EventWindow object responsible for holding
// fixed or continuous windows of events based on a given size.
//
var EventWindow = module.exports = function EventWindow(options) {
  if (!options || !options.size) {
    throw new Error('options.size is required.');
  }

  Window.call(this, options);
  this.size = options.size;
};

//
// Inherit from Window.
//
util.inherits(EventWindow, Window);

//
// ### function write (data)
// #### @data {Object} Data to write to this window.
// Writes the specified `data` to this window.
//
EventWindow.prototype.write = function (data) {
  this.data.push(data);

  if (this.fixed) {
    //
    // If we should emit fixed windows of events
    // then do so. We reset `this.data` when the limit
    // is reached.
    //
    if (this.data.length === this.size) {
      this.emit('data', this.data.slice());
    }

    this.data.length = 0;
  }
  else {
    //
    // Otherwise emit the window on each event
    // and truncating the events if we have reached
    // the limit
    //
    if (this.data.length > this.size) {
      this.data.shift();
    }

    this.emit('data', this.data.slice());
  }
};