import nodeExternals from 'webpack-node-externals';
var path = require('path')

export default {
  target: 'node',
  externals: [nodeExternals()],
  module: {
    loaders: [
        //{ test: /\.jsx$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
        { test: /\.js$/, exclude: /node_modules/, loaders: ["react-hot", "babel"] },
        { test: /\.css$/, loader: "style!css" },
        { test: /\.sass$/, exclude: /node_modules/, loader: "style!css!sass"},
        { test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'file?hash=sha512&digest=hex&name=[hash].[ext]',
                    'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
                ]
              },
        { test: /\.json$/, loader: "json" },
    ]
  },
  devtool: "cheap-module-source-map",
  resolve: {
    alias:{
      app : path.resolve("./app/js"),
      sass : path.resolve("./app/sass"),
      lang : path.resolve("./lang")
    }
  },
};
