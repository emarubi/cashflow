// Registers path aliases at runtime for compiled output (dist/)
const { register } = require('tsconfig-paths')
const { compilerOptions } = require('./tsconfig.json')

register({
  baseUrl: './dist',   // compiled output lives in dist/
  paths: compilerOptions.paths,
})
