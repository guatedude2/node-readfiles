export const buildFilter = (filtersParam: string | string[]) => {
  const filters = filtersParam instanceof Array ? filtersParam.slice() : [filtersParam];
  const filterArray = [];

  if (filters.length === 0) return null;

  while (filters.length > 0) {
    const filter = filters.shift();
    filterArray.push(
      `\\/?${filter
        .replace(/([./\\])/g, '\\$1')
        .replace(/(\*?)(\*)(?!\*)/g, (match, prefix) => {
          if (prefix === '*') {
            return match;
          }
          return '[^\\/]*';
        })
        .replace(/\?/g, '[^\\/]?')
        .replace(/\*\*/g, '.*')
        .replace(/([\-\+\|])/g, '\\$1')}`,
    );
  }
  return new RegExp(`^${filterArray.join('|')}$`, 'i');
};
