#!/usr/bin/env node

var commands = require('./index');
var program = require('commander');

function logAsyncErrors(fn) {
  // decorate commands with error logging callback
  return function() {
    fn(function(error, message) {
      if (error) {
        console.log('Error: ' + error.message);
      }
      if (message) {
        console.log('Message: ' + message);
      }
    });
  };
}

program.version('0.0.1');

program.command('push')
  .description('populate remote db with dump of local db')
  .action(logAsyncErrors(commands.push));

program.command('pull')
  .description('the other way round')
  .action(logAsyncErrors(commands.pull));

/*program.command('clean')
  .description('remove old database dumps from syncdb directory')
  .action(logAsyncErrors(commands.clean));

program.command('install')
  .description('install remote.php script on remote server')
  .action(logAsyncErrors(commands.install));*/

// TODO display message end exit with error on unknwon command
//program.command('*')
//  .action(function (env) {
//    console.log("'" + env + "' is not a syncdb command. See 'syncdb --help'");
//  });

program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  process.exit(1);
}

