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
  this._sum = options.sum;
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
  var now = new Date(),
      local,
      time;

  //
  // Track internal time because we can trust ourselves
  // Remark: If we want to use a sorted data structure this would not be
  // necessary
  //
  data._time = +now;
  this.data.push(data);
  this.value++;

  if (this.fixed) {
    this.emit('data', this.valueNow(now));
  }
};

//
// ### function valueNow (now)
// Trims the `value` and `data` on this instance
// to `Date.now` and returns the appropriate value.
//
TimeWindow.prototype.valueNow = function (now) {
  //
  // If there is no data in this `TimeWindow` instance
  // then simply return 0 or an empty array.
  //
  if (!this.data.length) {
    return this._sum ? 0 : [];
  }

  var remove = 0;
  while (remove < this.data.length && (!this.data[remove]
    || (now - new Date(this.data[remove]._time)) >= this.duration)) {
    remove++;
  }

  this.data.splice(0, remove);
  if (this._sum) {
    this.value -= remove;
    return this.value;
  }

  return this.data.slice();
};

//
// ### function clone ()
// Returns a perfect deep copy of this instance.
//
TimeWindow.prototype.clone = function () {
  var copy = new TimeWindow({
    duration: this.duration,
    data:     this.data.slice(),
    fixed:    this.fixed,
    sum:      this._sum
  });

  copy.value = this.value;
  return copy;
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
    var data = self._sum ? self.value : self.data.slice();
    self.emit('data', data);
    self.data.length = 0;
    self.value = 0;
  }, this.duration);
};
