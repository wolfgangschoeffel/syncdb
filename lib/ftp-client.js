module.exports = function(configFtp) {

  var fs  = require('fs');
  var FTP = require('ftp');

  function withFtp(callback) {
    var ftp = new FTP();

    ftp.on('error', callback);

    ftp.on('ready', function() {
      callback(null, ftp);
    });

    ftp.connect({
      host: configFtp.host,
      user: configFtp.user,
      password: configFtp.password
    });
  }

  function ftpGetFile(fileName, callback) {

    withFtp(function(error, ftp) {

      if (error) return callback(error);
      ftp.get(fileName, function(error, stream) {

        if (error) return callback(error);

        stream.once('close', function() {
          ftp.end();
          callback();
        });

        stream.pipe(fs.createWriteStream(fileName));
      });
    });
  }

  function ftpPutFile(fileName, callback) {

    withFtp(function(error, ftp) {

      if (error) return callback(error);
      ftp.put(fileName, fileName, function(error) {

        ftp.end();
        callback(error);
      });
    });
  }

  return {
    get: ftpGetFile,
    put: ftpPutFile
  };
}
