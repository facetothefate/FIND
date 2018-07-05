const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode : "development",
    devtool: 'cheap-module-source-map',
    resolve : {
        alias: {
            everpolate: path.resolve(__dirname, 'node_modules/everpolate/lib/')
        }
    },
    entry:[
        path.resolve(__dirname,'src/index.js'),
    ],
    output: {
        pathinfo: true,
        filename: 'build/find.js',
        library: ['FIND']
    }
}