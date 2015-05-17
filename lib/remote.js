module.exports = function(remoteUrl) {

  var request = require('request');

  function remoteCommand(method, localDumpName, callback) {

    if (typeof localDumpName === 'function') {
      callback = localDumpName;
      localDumpName = '';
    }
    // TODO: shouldn’t we have some kind of authentication here?
    request({
      url: remoteUrl + '/syncdb/remote.php',
      method: 'POST',
      json: true,
      body: {
        method: method,
        localDumpName: localDumpName // empty string for pull!
      }
    }, function(error, response, body) {
      callback(error, body);
    });
  }

  function remotePush(dumpName, callback) {
    remoteCommand('push', dumpName, callback);
  }

  function remotePull(callback) {
    remoteCommand('pull', function (error, body) {
      if (error) {
        callback(error);
      } else {
        callback(error, 'syncdb/sql/' + body.remoteDumpName);
      }
    });
  }

  return {
    push: remotePush,
    pull: remotePull
  };
}
