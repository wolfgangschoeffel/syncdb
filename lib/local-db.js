module.exports = function(configLocalDb) {

  var childProcess = require('child_process');

  function isoDate() {
    return (new Date()).toISOString().slice(0, 16).replace(/T|:/g, '-');
  }

  function dumpLocalDB() {
    var localDumpDir = 'syncdb/sql';
    var localDumpName = 'local-db-' + isoDate() + '.sql';
    var localDumpFile = localDumpDir + '/' + localDumpName;
    var localDump = 'mysqldump -u ' + configLocalDb.user
      + ' -p' + configLocalDb.password + ' ' + configLocalDb.name
      + ' > ' + localDumpFile;

    if (childProcess.spawnSync(localDump).status !== 0) {
      console.log('dump failed');
      process.exit(1);
    }

    return localDumpFile;
  }

  function populateLocalDB(dumpFile) {
    var localPopulate = 'mysql -u ' + configLocalDb.user
      + ' -p' + configLocalDb.password + ' ' + configLocalDb.name
      + ' < ' + dumpFile;

    if (childProcess.spawnSync(localPopulate).status !== 0) {
      console.log('populating failed');
      process.exit(1);
    }
  }

  return {
    dump: dumpLocalDB,
    populate: populateLocalDB
  };
}
