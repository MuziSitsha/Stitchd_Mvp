// Vercel serverless function entry point.
//
// This file is intentionally plain JavaScript (not TypeScript) so Vercel's
// zero-config Node builder deploys it as-is with no bundling step. It just
// requires the already-compiled Nest handler produced by `yarn build`
// (nest build / tsc), which is what correctly emits the decorator metadata
// NestJS's dependency injection relies on.
module.exports = require('../dist/src/serverless.js').default;
