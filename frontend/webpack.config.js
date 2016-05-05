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

module.exports = {
    entry: [
      'webpack/hot/only-dev-server',
      'webpack-dev-server/client?http://localhost:3000',
      "./app/js/app.js"
    ],
    output: {
        path: __dirname + '/dist/',
        filename: "js/serverboards-[hash].js"
    },
    devtool: "source-map",
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
      new webpack.NoErrorsPlugin(),
      HTMLWebpackPluginConfig,
      new CopyWebpackPlugin([
        {from:'app/css', to:'css'},
        {from:'app/js/jquery-2.2.3.min.js', to:'js'},
        {from:'app/js/semantic.min.js', to:'js'},
      ]),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
      })
    ],
    sassLoader: {
      includePaths: [path.resolve(__dirname, "./sass")]
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
