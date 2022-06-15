import { buildFilter } from './build-filter';

describe('buildFilter', () => {
  it('creates a filter RegExp given a filter string', () => {
    const result = buildFilter('.');

    expect(result).toEqual(/^\/?\.$/i);
  });

  it('creates a filter RegExp given a wildcard filter string', () => {
    const result = buildFilter('*');

    expect(result).toEqual(/^\/?[^\/]*$/i);
  });

  it('creates a filter RegExp given a wildcard filter string', () => {
    const result = buildFilter('**');

    expect(result).toEqual(/^\/?.*$/i);
  });

  it('creates a filter RegExp given an array of filters', () => {
    const result = buildFilter(['**/*123*', '**/abc.*']);

    expect(result).toEqual(/^\/?.*\/[^\/]*123[^\/]*|\/?.*\/abc\.[^\/]*$/i);
  });
});
