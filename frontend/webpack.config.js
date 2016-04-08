var webpack = require('webpack');
module.exports = {
    entry: [
      'webpack/hot/only-dev-server',
      "./js/app.js"
    ],
    output: {
        path: __dirname + '/dist/js/',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.js?$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
            { test: /\.css$/, loader: "style!css" },
            { test: /\.sass$/, exclude: /node_modules/, loader: "!style!css!sass"}
        ]
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ]

};
