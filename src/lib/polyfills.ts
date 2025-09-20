// Polyfills for server-side rendering and build process

// Fix for 'self is not defined' error
if (typeof self === 'undefined') {
  (global as any).self = global;
}

// Fix for 'window is not defined' error
if (typeof window === 'undefined') {
  (global as any).window = {};
}

// Fix for 'document is not defined' error
if (typeof document === 'undefined') {
  (global as any).document = {};
}

export {};
