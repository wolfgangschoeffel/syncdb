var mock = require('mock-fs');
module.exports = mock.fs({
  'upload-me.txt': 'Just some test data for ftp upload!'
});
