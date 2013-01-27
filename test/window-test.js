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
      assert.isNumber(win.mean);
      assert.isNumber(win.sum);
      assert.isNumber(win.variance);
      assert.isNumber(win.stdDev);
      assert.isNumber(win.median);
      assert.isArray(win.sorted);
    }
  }
}).export(module);