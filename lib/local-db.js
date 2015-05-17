module.exports = function(configLocalDb) {

  var childProcess = require('child_process');
  var fs           = require('fs');

  function isoDate() {

    return (new Date()).toISOString().slice(0, 16).replace(/T|:/g, '-');
  }

  function dumpLocalDB(callback) {

    var localDumpDir = 'syncdb';
    var localDumpName = 'local-db-' + isoDate() + '.sql';
    var localDumpFile = localDumpDir + '/' + localDumpName;

    var mysqldump = childProcess.spawn('mysqldump', [
        '-u', configLocalDb.user,
        '-p' + configLocalDb.password, // sic, password is attached w/o space!
        configLocalDb.name
    ]);

    mysqldump.on('close', function(code) {
      if (code !== 0) {
        callback(new Error('Local mysqldump failed!'));
      } else {
        callback(null, localDumpFile);
      }
    });

    mysqldump.stdout.pipe(fs.createWriteStream(localDumpFile));
  }

  function populateLocalDB(dumpFile, callback) {

    var mysql = childProcess.spawn('mysql', [
        '-u', configLocalDb.user,
        '-p' + configLocalDb.password,
        configLocalDb.name
    ]);

    mysql.on('close', function(code) {
      if (code !== 0) {
        callback(new Error('Local database population failed!'));
      } else {
        callback();
      }
    });

    fs.createReadStream(dumpFile).pipe(mysql.stdin);
  }

  return {
    dump: dumpLocalDB,
    populate: populateLocalDB
  };
}
