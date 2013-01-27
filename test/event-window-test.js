/*
 * window-test.js: Tests for the Window prototype.
 *
 * (C) 2012, Charlie Robbins 
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    EventWindow = require('../lib').EventWindow;
    
vows.describe('window-stream/event-window').addBatch({
  "Window with simple values": {
    topic: function () {
      var window = new EventWindow({ size: 10 });
      [15, 20, 35, 40, 50].forEach(function (val) {
        window.write({ metric: val });
      });
      
      return window;
    },
    "mean": function (win) {
      assert.equal(win.mean, 32);
    },
    "sum": function (win) {
      assert.equal(win.sum, 160);
    },
    "median": function (win) {
      assert.equal(win.median, 30);
    },
    "variance": function (win) {
      assert.equal(win.variance, 166);
    },
    "stdDev": function (win) {
      assert.equal(win.stdDev, Math.sqrt(166));
    },
    "percentile(p)": {
      "10%": function (win) {
        assert.equal(win.percentile(10), 15);
      },
      "40%": function (win) {
        assert.equal(win.percentile(40), 27.5);
      },
      "70%": function (win) {
        assert.equal(win.percentile(70), 42.5);
      },
      "80%": function (win) {
        assert.equal(win.percentile(80), 46.25);
      },
      "100%": function (win) {
        assert.equal(win.percentile(100), 55);
      }
    },
    "rank(p)": {
      "10%": function (win) {
        assert.equal(win.rank(10), 1);
      },
      "40%": function (win) {
        assert.equal(win.rank(40), 2.5);
      },
      "50%": function (win) {
        assert.equal(win.rank(50), 3);
      },
      "70%": function (win) {
        assert.equal(win.rank(70), 4);
      },
      "80%": function (win) {
        assert.equal(win.rank(80), 4.5);
      },
      "100%": function (win) {
        assert.equal(win.rank(100), 5.5);
      }
    }
  }
}).export(module);