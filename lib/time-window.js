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
  if (!(this instanceof TimeWindow)) { return new TimeWindow(options) }
  if (!options || !options.duration) {
    throw new Error('options.duration is required.');
  }

  Window.call(this, options);
  this.duration = options.duration;
  this.sum = options.sum;
  this.value = 0;

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

  this.value++;

  if (this.fixed) {
    while ((now - new Date(this.data[remove].time)) >= this.duration
        && remove < this.data.length) {
      remove++;
    }

    this.data.splice(0, remove);
    if (this.sum) {
      this.value -= remove;
      return this.emit('data', this.value);
    }

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
    var data = self.sum ? self.value : self.data.slice();
    self.emit('data', data);
    self.data.length = 0;
    self.value = 0;
  }, this.duration);
};
