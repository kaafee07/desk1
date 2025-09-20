// Global polyfills for server-side rendering
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  if (typeof global.document === 'undefined') {
    global.document = {};
  }
}
