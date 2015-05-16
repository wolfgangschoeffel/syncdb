var FTP = require('ftp');
var fs  = require('fs');

module.exports = function(configFtp) {
  function withFtp(callback) {
    var ftp = new FTP();

    ftp.on('ready', function() {
      callback(ftp);
    });

    ftp.connect({
      host: configFtp.host,
      user: configFtp.user,
      password: configFtp.password
    });
  }

  function ftpGetFile(fileName, callback) {

    withFtp(function(ftp) {

      ftp.get(fileName, function(err, stream) {
        if (err) {
          throw err;
        }

        stream.once('close', function() {
          ftp.end();
          callback(fileName);
        });

        stream.pipe(fs.createWriteStream(fileName));
      });
    });
  }

  function ftpPutFile(fileName, callback) {

    withFtp(function(ftp) {

      ftp.put(fileName, fileName, function(err) {
        if (err) {
          throw err;
        }
        ftp.end();

        callback(fileName);
      });
    });
  }

  return {
    get: ftpGetFile,
    put: ftpPutFile
  };
}
