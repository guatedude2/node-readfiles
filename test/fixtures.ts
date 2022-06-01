export const flatPathFixture = {
  '/path/to/dir': {
    'abc.txt': 'ABC',
    'def.dat': 'DEF',
    'test123.txt': '123',
    'test456.dat': '456',
  },
};

export const deepPathFixture = {
  '/path/to/dir': {
    '.system': 'SYSTEM',
    'def.dat': 'DEF',
    'abc.txt': 'ABC',
    'abc123.txt': 'ABC123',
    subdir: {
      '.dot': 'DOT',
      'test456.dat': '456',
      'test789.txt': '789',
      'test123.txt': '123',
      'abc123.txt': 'ABC123',
      subsubdir: {
        '.hidden': 'HIDDEN',
        'abc123.dat': 'ABC123',
        'def456.dat': '456',
      },
    },
    otherdir: {
      '.other': 'DOT',
      'test789.txt': '789',
      'test123.txt': '123',
      subsubdir: {
        '.hidden': 'HIDDEN',
        'abc123.txt': 'ABC123',
        'def456.txt': '456',
      },
    },
  },
};

export const badDeepPathFixture = {
  '/path/to/dir': {
    '.system': 'SYSTEM',
    'def.dat': 'DEF',
    'abc.txt': 'ABC',
    'abc123.txt': 'ABC123',
    subdir: {
      '.dot': 'DOT',
      'error-file.dat': false,
      'test456.dat': '456',
      'test789.txt': '789',
      'test123.txt': '123',
      'abc123.txt': 'ABC123',
      subsubdir: {
        '.hidden': 'HIDDEN',
        'abc123.dat': 'ABC123',
        'def456.dat': '456',
      },
    },
    otherdir: {
      '.other': 'DOT',
      'error-file.dat': false,
      'test789.txt': '789',
      'test123.txt': '123',
      subsubdir: {
        '.hidden': 'HIDDEN',
        'abc123.txt': 'ABC123',
        'def456.txt': '456',
      },
    },
  },
};
