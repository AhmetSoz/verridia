if (!process.argv.some((arg) => arg.startsWith('--book='))) {
  process.argv.push('--book=2');
}
require('./baski');
