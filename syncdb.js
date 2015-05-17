#!/usr/bin/env node

var commands = require('./index');
var program = require('commander');

program.version('0.0.1');

program.command('push')
  .description('populate remote db with dump of local db')
  .action(commands.push);

program.command('pull')
  .description('the other way round')
  .action(commands.pull);

program.command('clean')
  .description('remove old database dumps from syncdb directory')
  .action(commands.clean);

program.command('install')
  .description('install remote.php script on remote server')
  .action(commands.install);
