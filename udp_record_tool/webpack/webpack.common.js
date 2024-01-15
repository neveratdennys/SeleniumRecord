const webpack = require("webpack");
const path = require('path');

module.exports = {
    entry: {
        popup: path.join(__dirname, '../src/popup.js'),
        options: path.join(__dirname, '../src/options.js'),
    },
    output: {
        path: path.join(__dirname, '../dist/js'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: "initial"
        }
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
