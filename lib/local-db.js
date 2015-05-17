var shell = require('shelljs');

module.exports = function(configLocalDb) {

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

    if (shell.exec(localDump).code !== 0) {
      console.log('dump failed');
      shell.exit(1);
    }

    return localDumpFile;
  }

  function populateLocalDB(dumpFile) {
    var localPopulate = 'mysql -u ' + configLocalDb.user
      + ' -p' + configLocalDb.password + ' ' + configLocalDb.name
      + ' < ' + dumpFile;

    if (shell.exec(localPopulate).code !== 0) {
      console.log('populating failed');
      shell.exit(1);
    }
  }

  return {
    dump: dumpLocalDB,
    populate: populateLocalDB
  };
}
