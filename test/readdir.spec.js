var expect = require('chai').expect;
var mock = require('mock-fs');
var readdir = require('../lib/readdir');
var fixtures = {
  flat: require('./fixtures/flat'),
  deep: require('./fixtures/deep'),
  deepError: require('./fixtures/deep-error')
};

describe('readdir method', function() {
  after(function () {
    mock.restore();
  });

  describe('callbacks', function () {
    beforeEach(function () {
      mock(fixtures.flat);
    });

    it('is called with the relative filename and the contents of each file', function(done) {
      var files = ['abc.txt', 'def.dat', 'test123.txt', 'test456.dat'];
      var contents = ['ABC', 'DEF', '123', '456'];
      readdir('/path/to/dir', function (err, filename, content) {
        expect(filename).to.equal(files.shift());
        expect(content).to.equal(contents.shift());
        if (files.length === 0) done();
      });
    });

    it('is called with an error on a file', function(done) {
      mock({
        '/path/to/dir':{
          'badfile.txt': mock.symlink({ path: '/fake/invalid/path'})
        }
      });
      readdir('/path/to/dir', function (err, filename, content) {
        expect(err.message).to.equal('ENOENT, no such file or directory \'/path/to/dir/badfile.txt\'');
        done();
      });
    });

    it('calls the done callback when finished traversing all files', function (done) {
      readdir('/path/to/dir', null, function (err, files, count) {
        expect(count).to.equal(4);
        done();
      });
    });

    it('calls the done callback with an error on a path', function(done) {
      readdir('/fake/invalid/dir', null, function (err, files, count) {
        expect(err.message).to.equal('ENOENT, no such file or directory \'/fake/invalid/dir\'');
        done();
      });
    });
  });


  describe('options', function () {
    beforeEach(function () {
      mock(fixtures.deep);
    });

    it('callback returns the list of files in reverse order when \'reverse\' is true', function(done) {
      readdir('/path/to/dir', {
        reverse: true
      }, null, function (err, files, count) {
        expect(files).to.deep.equal([
          'subdir/test789.txt',
          'subdir/test456.dat',
          'subdir/test123.txt',
          'subdir/subsubdir/def456.dat',
          'subdir/subsubdir/abc123.dat',
          'subdir/abc123.txt',
          'otherdir/test789.txt',
          'otherdir/test123.txt',
          'otherdir/symlink.dat',
          'otherdir/subsubdir/def456.txt',
          'otherdir/subsubdir/abc123.txt',
          'def.dat',
          'abc123.txt',
          'abc.txt'
        ]);
        done();
      });
    });

    it('callback returns the full path of the files when \'filenameFormat\' is \'readdir.FULL_PATH\'', function(done) {
      var count = 0;
      var expectFiles = [
        '/path/to/dir/abc.txt',
        '/path/to/dir/abc123.txt',
        '/path/to/dir/def.dat',
        '/path/to/dir/otherdir/subsubdir/abc123.txt',
        '/path/to/dir/otherdir/subsubdir/def456.txt',
        '/path/to/dir/otherdir/symlink.dat',
        '/path/to/dir/otherdir/test123.txt',
        '/path/to/dir/otherdir/test789.txt',
        '/path/to/dir/subdir/abc123.txt',
        '/path/to/dir/subdir/subsubdir/abc123.dat',
        '/path/to/dir/subdir/subsubdir/def456.dat',
        '/path/to/dir/subdir/test123.txt',
        '/path/to/dir/subdir/test456.dat',
        '/path/to/dir/subdir/test789.txt'
      ]
      readdir('/path/to/dir', {
        filenameFormat: readdir.FULL_PATH
      }, function (err, filename) {
        expect(filename).to.equal(expectFiles[count++]);
      }, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns the relative path of the files when \'filenameFormat\' is \'readdir.RELATIVE\'', function(done) {
      var count = 0;
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/symlink.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt'
      ]
      readdir('/path/to/dir', {
        filenameFormat: readdir.RELATIVE
      }, function (err, filename) {
        expect(filename).to.equal(expectFiles[count++]);
      }, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns only the filename of the file when \'filenameFormat\' is \'readdir.FILENAME\'', function(done) {
      var count = 0;
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'abc123.txt',
        'def456.txt',
        'symlink.dat',
        'test123.txt',
        'test789.txt',
        'abc123.txt',
        'abc123.dat',
        'def456.dat',
        'test123.txt',
        'test456.dat',
        'test789.txt'
      ];
      readdir('/path/to/dir', {
        filenameFormat: readdir.FILENAME
      }, function (err, filename) {
        expect(filename).to.equal(expectFiles[count++]);
      }, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('does not call done when one file throws an error and \'doneOnError\' is false', function(done) {
      mock(fixtures.deepError);

      fileCount = 0;
      readdir('/path/to/dir', {
        doneOnError: false
      }, function (err, filename) {
        fileCount++;
      }, function (err, files, count) {
        expect(count).to.equal(11);
        done();
      });
    });

    it('callback does not return the file contents when \'readContents\' is false', function(done) {
      readdir('/path/to/dir', {
        readContents: false
      }, function (err, filename, contents) {
        expect(contents).to.be.null;
      }, function (err, files, count) {
        done();
      });
    });

    it('callback returns file contents encoded in the specified \'encoding\' type', function(done) {
      var count = 0;
      var expectFiles = {
        'abc.txt': 'ABC',
        'abc123.txt': 'ABC123',
        'def.dat': 'DEF',
        'otherdir/subsubdir/abc123.txt': 'ABC123',
        'otherdir/subsubdir/def456.txt': '456',
        'otherdir/symlink.dat': '123',
        'otherdir/test123.txt': '123',
        'otherdir/test789.txt': '789',
        'subdir/abc123.txt': 'ABC123',
        'subdir/subsubdir/abc123.dat': 'ABC123',
        'subdir/subsubdir/def456.dat': '456',
        'subdir/test123.txt': '123',
        'subdir/test456.dat': '456',
        'subdir/test789.txt': '789'
      };

      readdir('/path/to/dir', {
        encoding: null
      }, function (err, filename, contents) {
        expect(contents).to.equal(expectFiles[filename]);
      }, function (err, files, count) {
        done();
      });
    });

    it('traverses the directory tree limiting to specified \'depth\'', function(done) {
      var count = 0;
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/symlink.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        depth: 1
      }, function (err, filename) {
        expect(filename).to.equal(expectFiles[count++]);
      }, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files including hidden files when \'hidden\' is true', function(done) {
      var count = 0;
      var expectFiles = [
        '.system',
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/.other',
        'otherdir/subsubdir/.hidden',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/symlink.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/.dot',
        'subdir/abc123.txt',
        'subdir/subsubdir/.hidden',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        hidden: true
      }, function (err, filename) {
        expect(filename).to.equal(expectFiles[count++]);
      }, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });
  });


  describe('filters', function () {

    it('callback returns all files in the given directory when the \'filter\' option is equal  \'*\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat'
      ];
      readdir('/path/to/dir', {
        filter: '*'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files in the given directory recursively when the \'filter\' option is equal \'**\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/symlink.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        filter: '**'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all "txt" files in the given directory when the \'filter\' option is equal \'*.txt\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt'
      ];
      readdir('/path/to/dir', {
        filter: '*.txt'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all "txt" files in the given directory recursively when the \'filter\' option is equal \'**/*.txt\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        filter: '**/*.txt'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files that match "abc.txt" in the given directory recursively when the \'filter\' option is equal \'**/abc123.txt\'', function(done) {
      var expectFiles = [
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'subdir/abc123.txt'
      ];
      readdir('/path/to/dir', {
        filter: '**/abc123.txt'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files that match "abc123.txt" in the given directory when the \'filter\' option is equal \'abc123.txt\'', function(done) {
      var expectFiles = [
        'abc123.txt'
      ];
      readdir('/path/to/dir', {
        filter: 'abc123.txt'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files in all sub-directory of the given directory when the \'filter\' option is equal \'*/*\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/symlink.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        filter: '*/*'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files where the extension matches "t?t" in the given directory when the \'filter\' option is equal \'*.??t\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt'
      ];
      readdir('/path/to/dir', {
        filter: '*.t?t'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files where the extension matches "t?t" in the given directory recursively when the \'filter\' option is equal \'**/*.??t\'', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test789.txt'
      ];
      readdir('/path/to/dir', {
        filter: '**/*.t??'
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });

    it('callback returns all files that match the array of filters in the given directory when the \'filter\' option is equal [\'*123*\', \'abc.*\'] ', function(done) {
      var expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/test123.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/test123.txt'
      ];
      readdir('/path/to/dir', {
        filter: ['**/*123*', '**/abc.*']
      }, null, function (err, files, count) {
        expect(files).to.deep.equal(expectFiles);
        done();
      });
    });
  });
});