var FTP = require('ftp');

function withFtp(callback) {
  var ftp = new FTP();

  ftp.on('ready', function() {
    callback(ftp);
  });

  ftp.connect({
    host: config.ftp.host,
    user: config.ftp.user,
    password: config.ftp.password
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

module.exports = {
  get: ftpGetFile,
  put: ftpPutFile
};
