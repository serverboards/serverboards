const webpack = require('webpack');
const path = require('path')

// To Reqrite index.html with proper bundle js
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const __DEV__ = process.env.NODE_ENV !== 'production'
const __PROD__ = !__DEV__
console.log("Building for %s", __DEV__ ? "development" : "production")

var entry=[]
if (__DEV__)
  entry=[
    'webpack/hot/only-dev-server',
    'webpack-dev-server/client?http://localhost:3000'
  ]

module.exports = {
    mode: __DEV__ ? "development" : "production",
    entry: [
      "./app/js/app.js"
    ].concat(entry),
    output: {
        path: path.resolve('dist/'),
        filename: "js/[name]-[hash].js",
        sourceMapFilename: 'js/[file].map'
    },
    resolve: {
      alias:{
        app : path.resolve("./app/js"),
        sass : path.resolve("./app/sass"),
        imgs : path.resolve("./app/imgs"),
        lang : path.resolve("./lang")
      }
    },
    devtool: "cheap-module-source-map",
    module: {
        rules: [
            //{ test: /\.jsx$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: ["babel-loader"]
            },
            {
              test: /\.css$/,
              use: [{
                loader: 'style-loader'
              }, {
                loader: 'css-loader'
              }
            ] },
            {
              test: /\.sass$/,
              use: [{
                loader: "style-loader"
              }, {
                loader: "css-loader"
              }, {
                loader: "sass-loader",
                options : {
                  includePaths: ["./"]
                }
              }]
            },
            { test: /\.(jpe?g|png|gif|svg)$/i,
              loaders: [
                'file-loader',
                {
                  loader: 'image-webpack-loader',
                  query: {
                    mozjpeg: {
                      progressive: true,
                    },
                    gifslice: {
                      interlaced: false,
                    },
                    optipng: {
                      optimizationLevel: 7,
                    },
                    pngquant: {
                      quality: '65-90',
                      speed: 4
                    }
                  }
                }
              ]
            },
            {
              test: /\.txt$/,
              use: 'raw-loader'
            },
            {
              test: /\.ya?ml$/,
              use: 'yaml-import-loader'
            }
        ]
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new HtmlWebpackPlugin({
        template: __dirname + '/app/index.html',
        filename: 'index.html',
        inject: 'body'
      }),
      new CopyWebpackPlugin([
        {from:'lang/*.json', to:'./'},
        {from:'app/css', to:'css'},
        {from:'app/js/jquery-2.2.3.min.js', to:'js'},
        {from:'app/js/semantic.min.js', to:'js'},
        {from:'app/imgs/favicon.png', to:'imgs'},
      ]),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(__DEV__),
        SERVERBOARDS_VERSION: JSON.stringify(require("./package.json").version),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      }),
      // new webpack.SourceMapDevToolPlugin({
      //   filename: '[file].map',
      //   exclude: /vendor/,
      // }),
    ].filter(function(l){ return l }),
    optimization: {
      splitChunks: {
      	cacheGroups: {
      		commons: {
      			test: /[\\/]node_modules[\\/]/,
      			name: "vendors",
      			chunks: "all"
      		}
      	}
      },
    }
  };
