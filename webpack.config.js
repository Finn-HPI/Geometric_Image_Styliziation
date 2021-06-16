'use strict';

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    devtool: 'eval-source-map',
    entry: './src/app.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src')]
            },
            {
                test: /\.(glsl|vert|frag)$/,
                use: { loader: 'webpack-glsl-loader'},
            },
            {
                test: /\.css$$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.pug$/,
                loader: 'html-loader?attributes=false'
            },
            {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.pug$/,
                loader: 'pug-html-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'vpa.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        library: undefined,
        libraryTarget: 'umd'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/views/index.pug',
            inject: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/views/css', to: 'css'},
                { from: 'src/views/img', to: 'img'},
                { from: 'src/views/models', to: 'models'}
            ]
        })
    ],
    stats: { assets: false}
};