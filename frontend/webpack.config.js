var webpack = require('webpack');
var path = require('path')

// To Reqrite index.html with proper bundle js
var HtmlWebpackPlugin = require('html-webpack-plugin')
var HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
  template: __dirname + '/app/index.html',
  filename: 'index.html',
  inject: 'body'
});

var CopyWebpackPlugin = require('copy-webpack-plugin');
var __DEV__ = process.env.NODE_ENV !== 'production'
console.log("Building for %s", __DEV__ ? "development" : "production")

var entry=[]
if (__DEV__)
  entry=[
    'webpack/hot/only-dev-server',
    'webpack-dev-server/client?http://localhost:3000'
  ]

module.exports = {
    entry: [
      "./app/js/app.js"
    ].concat(entry),
    output: {
        path: path.resolve('dist/'),
        filename: "js/bundle.js"
    },
    resolve: {
      alias:{
        app : path.resolve("./app/js"),
        sass : path.resolve("./app/sass")
      }
    },
    devtool: __DEV__ ? "source-map" : "cheap-module-source-map",
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
        ]
    },
    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.NoErrorsPlugin(),
      HTMLWebpackPluginConfig,
      new CopyWebpackPlugin([
        {from:'app/css', to:'css'},
        {from:'app/js/jquery-2.2.3.min.js', to:'js'},
        {from:'app/js/semantic.min.js', to:'js'},
      ]),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(__DEV__)
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': __DEV__ ? JSON.stringify("development") : JSON.stringify("production")
        }
      })
    ],
    sassLoader: {
      includePaths: [path.resolve("./sass")]
    },
    imageWebpackLoader: {
      pngquant:{
        quality: "65-90",
        speed: 4
      },
      svgo:{
        plugins: [
          {
            removeViewBox: false
          },
          {
            removeEmptyAttrs: false
          }
        ]
      }
    }
  };
