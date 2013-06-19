/*
 * moving-average-test.js: Tests for the moving average stream.
 *
 * (C) 2012, Charlie Robbins
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    MovingAverage = require('../lib').MovingAverage;

var testData = [
  0,
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024
];

vows.describe('window-stream/moving-average').addBatch({
  "MovingAverage": {
    "with simple type": {
      "and event window": {
        topic: new MovingAverage({ type: 'simple', size: 10 }),
        "should have the correct methods and properties": function (avg) {
          assert.isNumber(avg.size);
          assert.ok(avg.window);
        },
        "when written to 12 times": {
          topic: function (avg) {
            var input = testData.slice(),
                output = [];

            var keep = function (d) {
              output.push(d.metric);
            }

            avg.on('data', keep);

            input.forEach(function (n) {
              avg.write({ metric: n });
            });

            avg.removeListener('data', keep);

            return output;
          },
          'should calculate 12 simple averages': function (output) {
            assert.equal(output.length, 12);
            assert.equal(output[0], 0);
            assert.equal(output[2], 1);
            assert.equal(output[4], 3);
            assert.equal(output[6], 9);
          }
        }
      },
      "and time window": {
        topic: new MovingAverage({ type: 'simple', duration: 500 }),
        "should have the correct methods and properties": function (avg) {
          assert.isNumber(avg.duration);
          assert.ok(avg.window);
        },
        "when written to 12 times": {
          topic: function (avg) {
            var self = this;

            var input = testData.slice(),
                output = [];

            var keep = function(d) {
              output.push(d.metric);
            }

            avg.on('data', keep);

            _write();
            function _write() {
              avg.write({ metric: input.shift() });
              if (input.length) {
                setTimeout(_write, 50);
              }
              else {
                avg.removeListener('data', keep);
                self.callback(null, output);
              }
            }
          },
          'should calculate 12 simple averages': function (err, output) {
            assert.ok(!err);
            assert.equal(output.length, 12);
          }
        }
      }
    },
    "with exponential type": {
      topic: new MovingAverage({ type: 'exponential' }),
      "should have the correct methods and properties": function (avg) {
        assert.ok(!avg.window);
      },
      "when written to 12 times": {
        topic: function (avg) {
          var input = testData.slice(),
              output = [];

          var keep = function (d) {
            output.push(d.metric);
          }

          avg.on('data', keep);

          input.forEach(function (n) {
            avg.write({ metric: n });
          });

          avg.removeListener('data', keep);

          return output;
        },
        'should calculate 12 simple averages': function (err, output) {

          assert.ok(!err);

          assert.equal(output.length, 12);
        }
      }
    }
  }
}).export(module);
