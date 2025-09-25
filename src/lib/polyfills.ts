// Polyfills for server-side rendering and build process

// Fix for 'self is not defined' error
if (typeof self === 'undefined') {
  (global as any).self = global;
}

// Fix for 'window is not defined' error
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      protocol: 'https:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      href: 'https://localhost/',
      origin: 'https://localhost'
    }
  };
}

// Fix for 'document is not defined' error
if (typeof document === 'undefined') {
  (global as any).document = {};
}

export {};
