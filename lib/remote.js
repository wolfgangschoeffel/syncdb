var request = require('request');

module.exports = function(remoteUrl) {
  function remoteCommand(method, localDumpName, callback) {
    // TODO: shouldn’t we have some kind of authentication here?
    request({
      url: remoteUrl + '/dbsync/dbsync.php',
      method: 'POST',
      json: true,
      body: {
        method: method,
        localDumpName: localDumpName
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

  function remotePull(dumpName, callback) {
    remoteCommand('pull', dumpName, callback);
  }

  return {
    push: remotePush,
    pull: remotePull
  };
}
