#!/usr/bin/env node

var commands = require('./index');
var program = require('commander');

function logAsyncErrors(fn) {
  // decorate commands with error logging callback
  return function() {
    fn(function(error) {
      if (error) {
        console.log('Error: ' + error.message);
      });
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

program.command('clean')
  .description('remove old database dumps from syncdb directory')
  .action(logAsyncErrors(commands.clean));

program.command('install')
  .description('install remote.php script on remote server')
  .action(logAsyncErrors(commands.install));
