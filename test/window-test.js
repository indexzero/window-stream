/*
 * window-test.js: Tests for the Window prototype.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    Window = require('../lib').Window;

vows.describe('window-stream/window').addBatch({
  "Window": {
    topic: new Window({ size: 10 }),
    "should have the correct methods and properties": function (win) {
      assert.isFunction(win.end);
      assert.isFunction(win.percentile);
      assert.isFunction(win.rank);
      assert.isFunction(win.mean);
      assert.isFunction(win.sum);
      assert.isFunction(win.variance);
      assert.isFunction(win.stdDev);
      assert.isFunction(win.median);
      assert.isFunction(win.sorted);
    }
  }
}).export(module);
