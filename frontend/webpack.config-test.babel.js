import nodeExternals from 'webpack-node-externals';
var path = require('path')

export default {
  target: 'node',
  externals: [nodeExternals()],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader"
      }
    ]
  },
  devtool: "cheap-module-source-map",
  resolve: {
    alias:{
      app : path.resolve("./app/js"),
    }
  },
};
