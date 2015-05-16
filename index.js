#!/usr/bin/env node

var request = require('request');
var FTP = require('ftp');
var fs = require('fs');
var shell = require('shelljs');
var moment = require('moment');

var config = require(shell.pwd() + '/dbsync/config.json');
var commands = {};

var replacements = [
  [config.remoteUrl, config.localUrl]
  //,[config.localDb.charset, config.remoteDb.charset]
];

commands.push = function() {
  var ftp = new FTP();

  // 1. Dump local db
  var localDumpDir = 'dbsync/sql';
  var localDumpName = 'local-db-' + moment().format('YYYY-MM-DD-HH-mm') + '.sql';
  var localDumpFile = localDumpDir + '/' + localDumpName;
  var localDump = 'mysqldump -u ' + config.localDb.user + ' -p' + config.localDb.password + ' ' + config.localDb.name + ' > ' + localDumpFile;

  if (shell.exec(localDump).code !== 0) {
    console.log('dump failed');
    shell.exit(1);
  }

  // 2. search and replace
  replacements.forEach(function(replacement) {
    shell.sed('-i', replacement[0], replacement[1], localDumpFile);
  });

  // 3. upload dump via ftp
  ftp.on('ready', function() {
    ftp.put(localDumpFile, localDumpFile, function(err) {
      if (err) {
        throw err;
      }
      ftp.end();

      request({
        url: config.remoteUrl + '/dbsync/dbsync.php',
        method: 'POST',
        json: true,
        body: {
          method: 'push',
          localDumpName: localDumpName
        }
      }, function(error, response, body) {
        if (error) {
          console.log(error);
        }
        if (!error && response.statusCode == 200) {
          console.log(body);
        }
      });

    });
  });

  ftp.connect({
    host: config.ftp.host,
    user: config.ftp.user,
    password: config.ftp.password
  });

}

//
//
//
//

commands.pull = function() {
  var ftp = new FTP();

  console.log('pulling');
  // 1. Dump local db
  var localDumpDir = 'dbsync/sql';
  var localDumpName = 'local-db-' + moment().format('YYYY-MM-DD-HH-mm') + '.sql';
  var localDumpFile = localDumpDir + '/' + localDumpName;
  var localDump = 'mysqldump -u ' + config.localDb.user + ' -p' + config.localDb.password + ' ' + config.localDb.name + ' > ' + localDumpFile;

  if (shell.exec(localDump).code !== 0) {
    console.log('dump failed');
    shell.exit(1);
  }

  request({
    url: config.remoteUrl + '/dbsync/remote.php',
    method: 'POST',
    json: true,
    body: {
      method: 'pull',
      localDumpName: localDumpName
    }
  }, function(error, response, body) {
    if (error) {
      console.log(error);
    }
    if (!error && response.statusCode == 200) {

      var remoteDumpName = body.remoteDumpName;
      var remoteDumpFile = 'dbsync/sql/' + remoteDumpName;

      // download via ftp
      ftp.on('ready', function() {
        ftp.get(remoteDumpFile, function(err, stream) {
          if (err) { throw err; }
          stream.once('close', function() { ftp.end(); });
          stream.pipe(fs.createWriteStream(remoteDumpFile));

          replacements.forEach(function(replacement) {
            shell.sed('-i', replacement[1], replacement[0], remoteDumpFile);
          });

          var localPopulate = 'mysql -u ' + config.localDb.user + ' -p' + config.localDb.password + ' ' + config.localDb.name + ' < ' + remoteDumpFile;

          if (shell.exec(localPopulate).code !== 0) {
            console.log('populating failed');
            shell.exit(1);
          }

          console.log('pull ready');

        });
      });

      ftp.connect({
        host: config.ftp.host,
        user: config.ftp.user,
        password: config.ftp.password
      });

    }
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

if (!commands[command]) {
  console.log('Command "' + command + '" not found');
  process.exit(1);
} else {
  commands[command].call();
}
