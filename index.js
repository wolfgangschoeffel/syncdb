var config  = require(process.cwd() + '/syncdb/config.json');

var fs      = require('fs');

var ftp     = require('./lib/ftp-client')(config.ftp);
var remote  = require('./lib/remote')(config.remoteUrl);
var localDB = require('./lib/local-db')(config.localDb);

var commands = {};

function escapeRegExp(str) {
  // escape search string like proposed here:
  // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function replaceInFile(searchString, replacement, file) {
  var regex = new RegExp(escapeRegExp(searchString), 'g');
  var result = fs.readFileSync(file, 'utf8').replace(regex, replacement);
  fs.writeFileSync(file, result, 'utf8');
  return result;
}

var replacements = [
  [config.remoteUrl, config.localUrl]
  //,[config.localDb.charset, config.remoteDb.charset]
];


commands.push = function(callback) {

  localDB.dump(function(error, localDumpFile) {
    if (error) return callback(error);

    replacements.forEach(function(replacement) {
      replaceInFile(replacement[1], replacement[0], localDumpFile);
    });

    ftp.put(localDumpFile, function(error) {
      if (error) return callback(error);

      var localDumpName = localDumpFile.slice(7); // strip syncdb/ path
      remote.push(localDumpName, callback);
    });
  });
};


commands.pull = function(callback) {

  // localDB.dump(); // (why?)
  remote.pull(function(error, remoteDumpFile) {
    if (error) return callback(error);

    ftp.get(remoteDumpFile, function(error) {
      if (error) return callback(error);

      replacements.forEach(function(replacement) {
        replaceInFile(replacement[0], replacement[1], remoteDumpFile);
      });

      localDB.populate(remoteDumpFile, function (error) {
        if (error) {
          callback(error);
        } else {
          callback(null, 'No errors, local database should be in sync :)');
        }
      });
    });
  });
}


/*commands.clean = function(callback) {

  fs.rmdir('syncdb/sql', function (error) {

    if (error) return callback(error);
    fs.mkdir('syncdb/sql', callback);
  });
}*/


//commands.install = function(callback) {
  // upload remote config and remote php file
  //callback();
//}


module.exports = commands;

