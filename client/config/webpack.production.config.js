import Config from 'webpack-config'

export default new Config().extend('config/webpack.base.config.js').merge({
  output: {
    filename: 'bundle.min.js'
  }
})
