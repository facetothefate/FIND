const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode : "development",
    devtool: 'cheap-module-source-map',
    entry:[
        path.resolve(__dirname,'src/index.js'),
    ],
    output: {
        pathinfo: true,
        filename: 'build/find.js',
        library: ['FIND']
    }
}