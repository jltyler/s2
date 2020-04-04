const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProd = (process.env.NODE_ENV === 'production');
// const isProd = (process.env.production === true);

console.log('isProd:', isProd);


module.exports = {
    entry: {
        app: './src/index.js'
    },
    output: {
        filename: '[name]-[hash].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.html$/,
                use: {
                    loader: "html-loader",
                    options: {
                        minimize: isProd,
                    }
                }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: {
                    loader: "file-loader?name=img/[name]-[md5:hash:base64:12].[ext]"
                }
            },
            {
                test: /\.svg$/,
                use: {
                    loader: 'svg-url-loader',
                    options: {
                      limit: 10000,
                    },
                  },
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            filename: "./index.html"
        })
    ],
    devServer: {
        port: 3000,
        compress: true,
    }
};