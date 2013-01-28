/*
 * time-window.js: Window of events over fixed time duration.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var util = require('util'),
    Window = require('./window');

//
// ### function TimeWindow (options)
// #### @options {Object} Options for this instance
// ####   @options.duration {number}  Time span to store events in this window.
// ####   @options.fixed    {boolean} Value indicating if this is a fixed window.
// Constructor function for the EventWindow object responsible for holding
// fixed or continuous windows of events based on a given time window (i.e. duration).
//
var TimeWindow = module.exports = function TimeWindow(options) {
  if (!options || !options.duration) {
    throw new Error('options.duration is required.');
  }

  Window.call(this, options);
  this.duration = options.duration;

  if (!this.fixed) {
    this.resetDuration();
  }
};

//
// Inherit from Window
//
util.inherits(TimeWindow, Window);

//
// ### function write (data)
// #### @data {Object} Data to write to this window.
// Writes the specified `data` to this window.
//
TimeWindow.prototype.write = function (data) {
  var now    = data.time ? new Date(data.time) : new Date(),
      remove = 0,
      time;

  this.data.push(data);

  if (this.fixed) {
    while ((now - new Date(this.data[remove].time)) >= this.duration
        && remove < this.data.length) {
      remove++;
    }

    this.data.splice(0, remove);
    this.emit('data', this.data.slice());
  }
};

//
// ### function resetDuration ()
// Resets the interval for this instance which
// emits the current window on each duration.
//
TimeWindow.prototype.resetDuration = function () {
  var self = this;

  if (this.durationId) {
    clearTimeout(this.durationId);
  }

  this.durationId = setInterval(function () {
    self.emit('data', self.data.slice());
    self.data.length = 0;
  }, this.duration);
};