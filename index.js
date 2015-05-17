var config  = require(process.cwd() + '/syncdb/config.json');

var fs      = require('fs');

var ftp     = require('./lib/ftp-client')(config.ftp);
var remote  = require('./lib/remote')(config.remoteUrl);
var localDB = require('./lib/local-db')(config.localDb);

var commands = {};

function replaceInFile(searchString, replacement, file) {
  var regex = new RegExp(searchString, 'g');
  var result = fs.readFileSync(file, 'utf8').replace(regex, replacement);
  fs.writeFileSync(file, result, 'utf8');
  return result;
}

var replacements = [
  [config.remoteUrl, config.localUrl]
  //,[config.localDb.charset, config.remoteDb.charset]
];

commands.push = function() {
  // 1. Dump local db
  var localDumpFile = localDB.dump();
  // 2. search and replace
  replacements.forEach(function(replacement) {
    replaceInFile(replacement[0], replacement[1], localDumpFile);
  });
  // 3. upload dump via ftp
  ftp.put(localDumpFile, function() {
    // 4. start remote script
    remote.push(localDumpName, function(body) {
      console.log(body);
      process.exit(0);
    });
  });
};

commands.pull = function() {

  // localDB.dump(); // (why?)

  remote.pull(function(remoteDumpFile) {
    // download via ftp
    ftp.get(remoteDumpFile, function() {

      replacements.forEach(function(replacement) {
        replaceInFile(replacement[1], replacement[0], remoteDumpFile);
      });

      localDB.populate(remoteDumpFile);
    });
  });
}

commands.clean = function() {
  fs.rmdir('syncdb/sql', function (err) {
    if (err) console.log(err);
    fs.mkdir('syncdb/sql', function (err) {
      if (err) console.log(err);
    });
  });
}

commands.install = function() {
  // upload remote config and remote php file
}

module.exports = commands;

