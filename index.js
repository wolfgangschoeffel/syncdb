#!/usr/bin/env node

var request = require('request');
var FTP = require('ftp');
var fs = require('fs');
var shell = require('shelljs');

var config = require(shell.pwd() + '/dbsync/config.json');
var commands = {};

function isoDate() {
  return (new Date()).toISOString().slice(0, 16).replace(/T|:/g, '-');
}

function replaceInFile(findString, replaceWith, fileName) {
  shell.sed('-i', findString, replaceWith, fileName);
}

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

function remoteCommand(method, localDumpName, callback) {
  // TODO: shouldn’t we have some kind of authentication here?
  request({
    url: config.remoteUrl + '/dbsync/dbsync.php',
    method: 'POST',
    json: true,
    body: {
      method: method,
      localDumpName: localDumpName
    }
  }, function(error, response, body) {
    if (error) {
      console.log(error);
      shell.exit(1);
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

function dumpLocalDB() {
  var localDumpDir = 'dbsync/sql';
  var localDumpName = 'local-db-' + isoDate() + '.sql';
  var localDumpFile = localDumpDir + '/' + localDumpName;
  var localDump = 'mysqldump -u ' + config.localDb.user
    + ' -p' + config.localDb.password + ' ' + config.localDb.name
    + ' > ' + localDumpFile;

  if (shell.exec(localDump).code !== 0) {
    console.log('dump failed');
    shell.exit(1);
  }

  return localDumpFile;
}

var replacements = [
  [config.remoteUrl, config.localUrl]
  //,[config.localDb.charset, config.remoteDb.charset]
];

commands.push = function() {

  // 1. Dump local db
  var localDumpFile = dumpLocalDB();

  // 2. search and replace
  replacements.forEach(function(replacement) {
    replaceInFile(replacement[0], replacement[1], localDumpFile);
  });

  // 3. upload dump via ftp
  ftpPutFile(localDumpFile, function() {

    // 4. start remote script
    remotePush(localDumpName, function(body) {
      console.log(body);
      shell.exit(0);
    });
  });
};

//
//
//
//

commands.pull = function() {

  console.log('pulling');

  dumpLocalDB();

  remotePull(localDumpName, function(body) {
    var remoteDumpName = body.remoteDumpName;
    var remoteDumpFile = 'dbsync/sql/' + remoteDumpName;

    // download via ftp
    ftpGetFile(remoteDumpFile, function() {

      replacements.forEach(function(replacement) {
        replaceInFile(replacement[1], replacement[0], remoteDumpFile);
      });

      var localPopulate = 'mysql -u ' + config.localDb.user + ' -p' + config.localDb.password + ' ' + config.localDb.name + ' < ' + remoteDumpFile;

      if (shell.exec(localPopulate).code !== 0) {
        console.log('populating failed');
        shell.exit(1);
      }

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
