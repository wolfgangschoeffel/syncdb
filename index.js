#!/usr/bin/env node

var shell = require('shelljs');

var config = require(shell.pwd() + '/dbsync/config.json');

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
      shell.exit(0);
    });
  });
};

commands.pull = function() {

  console.log('pulling');

  localDB.dump();

  remote.pull(localDumpName, function(body) {
    var remoteDumpName = body.remoteDumpName;
    var remoteDumpFile = 'dbsync/sql/' + remoteDumpName;

    // download via ftp
    ftp.get(remoteDumpFile, function() {

      replacements.forEach(function(replacement) {
        replaceInFile(replacement[1], replacement[0], remoteDumpFile);
      });

      localDB.poopulate(remoteDumpFile);

      console.log('pull ready');
    });
  });
}

commands.clean = function() {
  shell.rm('dbsync/sql/*.sql');
}

commands.install = function() {
  // upload remote config and remote php file
}

///////////////////////////
// execution //
///////////////////////////

var args = process.argv.slice(2);
var command = args[0];

if (process.argv.length < 3
  || command === 'help' || command === '-h' || command === '--help') {
  var usage = '\n\
syncdb is a tool for syncing mysql dbs via ftp.\n\
available commands:\n\
\n\
  push\n\
    populate remote db with dump of local db\n\
\n\
  pull\n\
    the other way round\n\
\n\
  clean\n\
    remove old database dumps from dbsync folder\n\
\n\
  install\n\
    install remote.php script on remote server\n\
\n\
  help\n\
    display this usage information\n\
  ';
  console.log(usage);
} else if (!commands.hasOwnProperty(command)) {
  console.log('Command "' + command + '" not found');
  console.log('Run "syncdb help" for more information');
  process.exit(1);
} else {
  commands[command].call();
}
