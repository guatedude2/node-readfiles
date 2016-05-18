var fs = require('fs');
var path = require('path');


function filterFile(filename, filters) {
  var filterArray = (filters instanceof Array) ? filters.slice() : [filters];

  while(filterArray.length > 0) {
    var filter = filterArray.shift();
    var filterRegex = new RegExp('^\\/?' +
        filter.replace(/\./g, '\\.')
           .replace(/(\*?)(\*)(?!\*)/g, function(match, prefix) {
              if(prefix == '*') {
                 return match;
              }
              return '[^\\/]*';
           })
           .replace(/\?/g, '[^\\/]?')
           .replace(/\*\*/g, '\.*')
           .replace(/([\-\+])/g, '\\$1') + '$'
        , 'i');

    if (filterRegex.test('/' + filename)) {
      return true;
    }

  }
  return false;
}

function readfiles(dir, options, callback, doneCallback) {
  if (typeof options === 'function' || options === null) {
    doneCallback = callback;
    callback = options;
    options = {};
  }
  options = options || {};
  doneCallback = doneCallback || function () {};


  var files = [];
  var subdirs = [];
  (function traverseDir(dirpath, done) {
    fs.readdir(dirpath, function (err, fileList) {
      if (err) {
        done(err, files.length, files);
        return;
      }

      // reverse the order of the files if the reverse option is true
      if (options.reverse === true) {
        fileList = fileList.reverse();
      }

      (function next() {
        if (fileList.length === 0) {
          done(null, files, files.length);
          return;
        }
        var filename = fileList.shift();
        var relFilename = path.join(subdirs.join('/'), filename);
        var fullpath = path.join(dirpath, filename);

        // skip file if it's a hidden file and the hidden option is not set
        if (options.hidden !== true && /^\./.test(filename)) {
          return next();
        }

        // stat the full path
        fs.stat(fullpath, function (err, stat) {
          if (err) {
            if (typeof callback === 'function') {
              callback(err, relFilename, null);
            }
            if (options.doneOnError !== false) {
              return doneCallback(err, files, files.length);
            }
            return next();
          }
          if (stat.isDirectory()) {

            // limit the depth of the traversal if depth is defined
            if (!isNaN(options.depth) && options.depth >= 0 && (subdirs.length + 1) > options.depth) {
              return next();
            }

            // traverse the sub-directory
            subdirs.push(filename);
            traverseDir(fullpath, function (err, count, files) {
              subdirs.pop();
              next();
            });
          } else if (stat.isFile()) {

            if (options.filter && !filterFile(relFilename, options.filter)) {
              return next();
            }

            // set the format of the output filename
            var outputName = relFilename;
            if (options.filenameFormat === readfiles.FULL_PATH) {
              outputName = fullpath;
            }else if (options.filenameFormat === readfiles.FILENAME) {
              outputName = filename;
            }
            files.push(outputName);

            // skip reading the file if readContents is false
            if (options.readContents === false) {
              callback(null, outputName, null);
              return next();
            }

            // read the file
            fs.readFile(fullpath, options.encoding || 'utf8', function (err, content) {
              if (typeof callback === 'function') {
                callback(err, outputName, content);
                if (err && options.doneOnError !== false) {
                  return doneCallback(err, files, files.length);
                }
              }
              next();
            });
          } else {
            next();
          }

        });
      })();
    });
  })(dir, doneCallback);
}

readfiles.RELATIVE = 0;
readfiles.FULL_PATH = 1;
readfiles.FILENAME = 2;

module.exports = readfiles;