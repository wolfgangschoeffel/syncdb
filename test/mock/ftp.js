var MockStream = require('./mockstream');

module.exports = function () {

  this.on = function(irrelevantEventName, callback) {
    process.nextTick(callback);
  };

  this.connect = function(credentialsObject) {};

  this.get = function(fileName, callback) {
    var stream;
    var error;
    if (fileName === 'test.txt') {
      stream = new MockStream('Test test test');
    } else if (fileName === 'test-111.txt') {
      stream = new MockStream('test!!!111');
    } else {
      error = new Error('We don’t have that file LOL');
    }
    process.nextTick(function () {
      callback(error, stream);
    });
  };

  this.put = function (fileName1, fileName2, callback) {
    process.nextTick(callback);
  };

  this.end = function () {};
};
