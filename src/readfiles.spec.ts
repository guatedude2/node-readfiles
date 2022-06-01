import readfiles from '../src/index';
import { badDeepPathFixture, deepPathFixture, flatPathFixture } from '../test/fixtures';
import { mockFs } from '../test/fs-helper';
import { FilenameFormat } from './consts';

describe('readfiles', () => {
  describe('defaults', () => {
    let clock;
    beforeEach(() => {
      jest.useFakeTimers();
      mockFs(flatPathFixture);
    });

    it('should return the list of files and their contents', done => {
      const files = ['abc.txt', 'def.dat', 'test123.txt', 'test456.dat'];
      const contents = ['ABC', 'DEF', '123', '456'];

      readfiles('/path/to/dir', (err, filename, content) => {
        expect(filename).toEqual(files.shift());
        expect(content).toEqual(contents.shift());
        if (files.length === 0) done();
      }).catch(err => {
        done(err);
      });
    });

    it('should throw an error on a file', done => {
      mockFs({
        '/path/to/dir': {
          'badfile.txt': false,
        },
      });
      readfiles('/path/to/dir', (err, filename, content) => {
        expect(content).toBeNull();
        expect(err.message).toEqual("ENOENT, no such file or directory, stat '/path/to/dir/badfile.txt'");
      }).catch(err => {
        expect(err.message).toEqual("ENOENT, no such file or directory, stat '/path/to/dir/badfile.txt'");
        done();
      });
    });

    it('should resolve the promise when finished traversing all files', done => {
      readfiles('/path/to/dir')
        .then(files => {
          expect(files).toHaveLength(4);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should call the done callback with an error on a path', function (done) {
      mockFs({});
      readfiles('/fake/invalid/dir').catch(function (err) {
        expect(err.message).toEqual("ENOENT, no such file or directory '/fake/invalid/dir'");
        done();
      });
    });

    it('should wait for an asynchronous callback when returning a function', function (done) {
      let count = 0;
      const expectFiles = ['abc.txt', 'def.dat', 'test123.txt', 'test456.dat'];

      readfiles('/path/to/dir', function (err, filename) {
        return function (next) {
          expect(filename).toEqual(expectFiles[count++]);
          setTimeout(function () {
            next();
          }, 1000);
          jest.advanceTimersToNextTimer();
        };
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe('options', () => {
    beforeEach(() => {
      mockFs(deepPathFixture);
    });

    it("callback returns the list of files in reverse order when 'reverse' is true", done => {
      readfiles('/path/to/dir', { reverse: true })
        .then(files => {
          expect(files).toEqual([
            'subdir/test789.txt',
            'subdir/test456.dat',
            'subdir/test123.txt',
            'subdir/subsubdir/def456.dat',
            'subdir/subsubdir/abc123.dat',
            'subdir/abc123.txt',
            'otherdir/test789.txt',
            'otherdir/test123.txt',
            'otherdir/subsubdir/def456.txt',
            'otherdir/subsubdir/abc123.txt',
            'def.dat',
            'abc123.txt',
            'abc.txt',
          ]);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns the full path of the files when 'filenameFormat' is 'readfiles.FULL_PATH'", done => {
      let count = 0;
      const expectFiles = [
        '/path/to/dir/abc.txt',
        '/path/to/dir/abc123.txt',
        '/path/to/dir/def.dat',
        '/path/to/dir/otherdir/subsubdir/abc123.txt',
        '/path/to/dir/otherdir/subsubdir/def456.txt',
        '/path/to/dir/otherdir/test123.txt',
        '/path/to/dir/otherdir/test789.txt',
        '/path/to/dir/subdir/abc123.txt',
        '/path/to/dir/subdir/subsubdir/abc123.dat',
        '/path/to/dir/subdir/subsubdir/def456.dat',
        '/path/to/dir/subdir/test123.txt',
        '/path/to/dir/subdir/test456.dat',
        '/path/to/dir/subdir/test789.txt',
      ];
      readfiles('/path/to/dir', { filenameFormat: FilenameFormat.FULL_PATH }, (err, filename) => {
        expect(filename).toEqual(expectFiles[count++]);
      })
        .then(files => {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("callback returns the relative path of the files when 'filenameFormat' is 'readfiles.RELATIVE'", done => {
      const count = 0;
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', { filenameFormat: FilenameFormat.RELATIVE }, (err, filename) => {
        expect(expectFiles).toContain(filename);
      })
        .then(files => {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("callback returns only the filename of the file when 'filenameFormat' is 'readfiles.FILENAME'", done => {
      const count = 0;
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'abc123.txt',
        'def456.txt',
        'test123.txt',
        'test789.txt',
        'abc123.txt',
        'abc123.dat',
        'def456.dat',
        'test123.txt',
        'test456.dat',
        'test789.txt',
      ];
      readfiles('/path/to/dir', { filenameFormat: FilenameFormat.FILENAME }, (err, filename) => {
        expect(expectFiles).toContain(filename);
      })
        .then(files => {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("does not stop reading files when one file throws an error and 'rejectOnError' is false", done => {
      let fileCount = 0;
      mockFs(badDeepPathFixture);
      readfiles('/path/to/dir', { rejectOnError: false }, err => {
        fileCount++;
      })
        .then(files => {
          expect(fileCount).toEqual(15);
          expect(files.length).toEqual(13);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("callback does not return the file contents when 'readContents' is false", done => {
      let fileCount = 0;
      readfiles('/path/to/dir', { readContents: false }, (err, filename, contents) => {
        expect(contents).toBeNull();
        fileCount++;
      })
        .then(files => {
          expect(fileCount).toEqual(13);
          expect(files.length).toEqual(13);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("callback returns file contents encoded in the specified 'encoding' type", done => {
      const expectFiles = {
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
        'subdir/test789.txt': '789',
      };

      readfiles('/path/to/dir', { encoding: null }, (err, filename, contents) => {
        expect(contents).toEqual(expectFiles[filename]);
      })
        .then(files => {
          expect(files.length).toEqual(13);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("traverses the directory tree limiting to specified 'depth'", done => {
      let count = 0;
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', { depth: 1 }, (err, filename) => {
        expect(filename).toEqual(expectFiles[count++]);
      })
        .then(files => {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it("callback returns all files including hidden files when 'hidden' is true", done => {
      let count = 0;
      const expectFiles = [
        '.system',
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/.other',
        'otherdir/subsubdir/.hidden',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/.dot',
        'subdir/abc123.txt',
        'subdir/subsubdir/.hidden',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', { hidden: true }, (err, filename) => {
        expect(filename).toEqual(expectFiles[count++]);
      })
        .then(files => {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });

  describe('filters', function () {
    it("callback returns all files in the given directory when the 'filter' option is equal  '*'", function (done) {
      const expectFiles = ['abc.txt', 'abc123.txt', 'def.dat'];
      readfiles('/path/to/dir', {
        filter: '*',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files in the given directory recursively when the 'filter' option is equal '**'", function (done) {
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/subsubdir/def456.dat',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', {
        filter: '**',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all \"txt\" files in the given directory when the 'filter' option is equal '*.txt'", function (done) {
      const expectFiles = ['abc.txt', 'abc123.txt'];
      readfiles('/path/to/dir', {
        filter: '*.txt',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all \"txt\" files in the given directory recursively when the 'filter' option is equal '**/*.txt'", function (done) {
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', {
        filter: '**/*.txt',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files that match \"abc.txt\" in the given directory recursively when the 'filter' option is equal '**/abc123.txt'", function (done) {
      const expectFiles = ['abc123.txt', 'otherdir/subsubdir/abc123.txt', 'subdir/abc123.txt'];
      readfiles('/path/to/dir', {
        filter: '**/abc123.txt',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files that match \"abc123.txt\" in the given directory when the 'filter' option is equal 'abc123.txt'", function (done) {
      const expectFiles = ['abc123.txt'];
      readfiles('/path/to/dir', {
        filter: 'abc123.txt',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files in all sub-directory of the given directory when the 'filter' option is equal '*/*'", function (done) {
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'def.dat',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test456.dat',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', {
        filter: '*/*',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files where the extension matches \"t?t\" in the given directory when the 'filter' option is equal '*.??t'", function (done) {
      const expectFiles = ['abc.txt', 'abc123.txt'];
      readfiles('/path/to/dir', {
        filter: '*.t?t',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files where the extension matches \"t?t\" in the given directory recursively when the 'filter' option is equal '**/*.??t'", function (done) {
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/subsubdir/def456.txt',
        'otherdir/test123.txt',
        'otherdir/test789.txt',
        'subdir/abc123.txt',
        'subdir/test123.txt',
        'subdir/test789.txt',
      ];
      readfiles('/path/to/dir', {
        filter: '**/*.t??',
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("callback returns all files that match the array of filters in the given directory when the 'filter' option is equal ['*123*', 'abc.*'] ", function (done) {
      const expectFiles = [
        'abc.txt',
        'abc123.txt',
        'otherdir/subsubdir/abc123.txt',
        'otherdir/test123.txt',
        'subdir/abc123.txt',
        'subdir/subsubdir/abc123.dat',
        'subdir/test123.txt',
      ];
      readfiles('/path/to/dir', {
        filter: ['**/*123*', '**/abc.*'],
      })
        .then(function (files) {
          expect(files).toEqual(expectFiles);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });
});
