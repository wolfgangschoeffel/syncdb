var request = require('request');

module.exports = function(remoteUrl) {
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
      if (error) {
        console.log(error);
        // TODO: should we really exit here or maybe better
        // throw an exception or something?
        process.exit(1);
      } else {
        callback(body);
      }
    });
  }

  function remotePush(dumpName, callback) {
    remoteCommand('push', dumpName, callback);
  }

  function remotePull(callback) {
    remoteCommand('pull', function (body) {
      callback('syncdb/sql/' + body.remoteDumpName);
    });
  }

  return {
    push: remotePush,
    pull: remotePull
  };
}
