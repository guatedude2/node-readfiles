/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';

const fattenFixtures = (fixtureMap: Record<string, any>, rootPath = '') => {
  let flatMap: Record<string, any> = {};
  if (rootPath) {
    flatMap[rootPath] = fixtureMap;
  }

  for (const path of Object.keys(fixtureMap).sort()) {
    if (typeof fixtureMap[path] !== 'object') {
      flatMap[`${rootPath}${path}`] = fixtureMap[path];
    } else {
      flatMap = Object.assign({}, flatMap, fattenFixtures(fixtureMap[path], `${rootPath}${path}/`));
    }
  }
  return flatMap;
};

export const mockFs = (fixture: Record<string, any>) => {
  jest.spyOn(fs, 'readdir').mockRestore();
  jest.spyOn(fs, 'stat').mockRestore();
  jest.spyOn(fs, 'readFile').mockRestore();

  const pathsMap = fattenFixtures(fixture);

  jest.spyOn(fs, 'readdir').mockImplementation((readdirPath: string, readdirCb: any) => {
    if (!pathsMap[`${readdirPath}/`]) {
      return readdirCb(new Error(`ENOENT, no such file or directory '${readdirPath}'`), null);
    }

    jest.spyOn(fs, 'stat').mockImplementation((statPath: string, statCb: any) => {
      if (!pathsMap[statPath] && !pathsMap[`${statPath}/`]) {
        return statCb(new Error(`ENOENT, no such file or directory, stat '${statPath}'`), null);
      }

      statCb(null, {
        isDirectory: () => typeof pathsMap[`${statPath}/`] === 'object',
        isFile: () => typeof pathsMap[statPath] === 'string',
      });
    });

    jest.spyOn(fs, 'readFile').mockImplementation(((readFilePath: string, encoding: string, readFileCb: any) => {
      if (!pathsMap[readFilePath]) {
        return readFileCb(new Error(`ENOENT, no such file or directory '${readFilePath}'`), null);
      }

      readFileCb(null, pathsMap[readFilePath]);
    }) as any);

    readdirCb(null, Object.keys(pathsMap[`${readdirPath}/`]).sort());
  });
};
