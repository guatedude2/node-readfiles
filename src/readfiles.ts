import * as fs from 'fs';
import * as path from 'path';
import { buildFilter } from './build-filter';
import { FilenameFormat } from './consts';

export interface ReadfilesOptions {
  async?: boolean;
  filter?: string | string[];
  rejectOnError?: boolean;
  reverse?: boolean;
  hidden?: boolean;
  depth?: number;
  filenameFormat?: FilenameFormat;
  readContents?: boolean;
  encoding?: BufferEncoding;
}

type AsyncFunction = (done: () => void) => void;

export type ReadfilesCallback = (
  err: Error | null,
  relativeFilename: string,
  content: string | null,
  stat: fs.Stats,
) => void | AsyncFunction;

export function readfiles(dir: string): Promise<string[]>;
export function readfiles(dir: string, callback?: ReadfilesCallback): Promise<string[]>;
export function readfiles(dir: string, options?: ReadfilesOptions, callback?: ReadfilesCallback): Promise<string[]>;
export function readfiles(
  dir: string,
  optionsProp?: ReadfilesOptions | ReadfilesCallback,
  callbackProp?: ReadfilesCallback,
): Promise<string[]> {
  let callback = callbackProp;
  let options = optionsProp as ReadfilesOptions;
  if (typeof optionsProp === 'function') {
    callback = optionsProp;
    options = {};
  }
  options = options || {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  callback = typeof callback === 'function' ? callback : () => {};

  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const subDirs: string[] = [];
    const filterRegExp = options.filter && buildFilter(options.filter);

    const traverseDir = (dirPath, done) => {
      fs.readdir(dirPath, (err, fileListProp) => {
        let fileList = fileListProp;
        if (err) {
          // if rejectOnError is not false, reject the promise
          if (options.rejectOnError !== false) {
            return reject(err);
          }
          return done(files);
        }

        // reverse the order of the files if the reverse option is true
        if (options.reverse === true) {
          fileList = fileList.reverse();
        }

        const next = () => {
          // if the file list is empty then call done
          if (fileList.length === 0) {
            done(files);
            return;
          }

          const filename = fileList.shift();
          const relFilename = path.join(subDirs.join('/'), filename);
          const fullPath = path.join(dirPath, filename);

          // skip file if it's a hidden file and the hidden option is not set
          if (options.hidden !== true && /^\./.test(filename)) {
            return next();
          }

          // stat the full path
          fs.stat(fullPath, (err, stat) => {
            if (err) {
              // call callback with the error
              const result = callback(err, relFilename, null, stat);

              // if callback result is a function then call the result with next as a parameter
              if (typeof result === 'function' && !err) {
                return result(next);
              }

              // if rejectOnError is not false, reject the promise
              if (options.rejectOnError !== false) {
                return reject(err);
              }

              return next();
            }

            if (stat.isDirectory()) {
              // limit the depth of the traversal if depth is defined
              if (!isNaN(options.depth) && options.depth >= 0 && subDirs.length + 1 > options.depth) {
                return next();
              }

              // traverse the sub-directory
              subDirs.push(filename);
              traverseDir(fullPath, () => {
                subDirs.pop();
                next();
              });
            } else if (stat.isFile()) {
              // test filters, if it does not match move to next file
              if (filterRegExp && !filterRegExp.test(`/${relFilename}`)) {
                return next();
              }

              // set the format of the output filename
              let outputName = relFilename;
              if (options.filenameFormat === FilenameFormat.FULL_PATH) {
                outputName = fullPath;
              } else if (options.filenameFormat === FilenameFormat.FILENAME) {
                outputName = filename;
              }
              files.push(outputName);

              // promise to handle file reading (if not disabled)
              new Promise<string | null>(resolve => {
                if (options.readContents === false) {
                  return resolve(null);
                }
                // read the file
                fs.readFile(fullPath, options?.encoding ?? 'utf8', (err, content) => {
                  if (err) throw err;
                  resolve(content);
                });
              })
                .then(content => {
                  // call the callback with the content
                  const result = callback(err, outputName, content, stat);

                  // if callback result is a function then call the result with next as a parameter
                  if (typeof result === 'function' && !err) {
                    return result(next);
                  }
                  // call the next if async is not true
                  options.async !== true && next();
                })
                .catch(err => {
                  if (options.rejectOnError !== false) {
                    return reject(err);
                  }

                  next();
                });
            } else {
              next();
            }
          });
        };

        next();
      });
    };
    traverseDir(dir, resolve);
  });
}
