const path = require('node:path')

const SITE = path.resolve(__dirname, '../site')

module.exports = {
  resolve: {
    alias: {
      '/js': path.join(SITE, 'js'),
      '/vendor': path.join(SITE, 'vendor'),
    },
  },
}
