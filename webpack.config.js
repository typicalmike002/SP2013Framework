var webpack = require('webpack'),
    path    = require('path'),
    fs      = require('fs');

module.exports = {

    // Uses the fs node.js library to dynamically add webpack entries to a json object:
    entry: fs.readdirSync(path.join(__dirname, '/Build/ts'))
            .reduce(function (map, page){

                // Converts typescript files inside the root of typescript to webpack entries:
                if ( /\.ts$/.test(path.basename(page) ) ) {
                    map[path.basename(page).replace(/\.ts$/, '')] = path.join(path.resolve('Build/ts'), page);
                } 

                // Converts typescript files inside the webparts folder to webpack entries: 
                if ( /webparts/.test(path.basename(page) ) ) {
                    fs.readdirSync(path.join(__dirname, '/Build/ts/webparts'))
                        .forEach(function (current){
                            map['/webparts/' + path.basename(current).replace(/\.ts$/, '')] = path.join(path.resolve('Build/ts/webparts'), current);
                        })
                }

                return map;
        }, {}),
    output: {
        path: path.join(__dirname, '/Branding/js/'),
        filename: '[name].min.js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [{
            test: /\.ts$/,
            loader: 'ts-loader'

        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                unused: false
            }
        })
    ]
};
