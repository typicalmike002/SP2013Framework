/**
 * gulpfile.js
 *
 * - Handles all build tool tasks.
 */

var gulp    = require('gulp'),
    sp      = require('./sharepoint.config.json'),
    onError = function (err){
    console.log(err);
    this.emit('end');
};




/**
 * Matchdep
 * 
 * - Automatically loads all package.json developer dependencies prefixed with 'gulp-'.
 */

require('matchdep').filterDev('gulp*').forEach(function( module ) {
    var module_name     = module.replace(/^gulp-/, '').replace(/-/, '');
    global[module_name] = require( module );
});




/**
 * Gulp's watch task.
 *
 * - The watch task used when the 'gulp' command is executed from the root of the project.
 *
 * - Watches for changes.  When change is detected, it'll run all linters and testers.  
 *
 * - Changes will be compiled and saved locally on success.
 */

gulp.task('watch', function(){

    // Watch css:
    gulp.watch('Build/sass/**/*.scss', ['push:css']);

    // Watch js:
    gulp.watch('Build/ts/**/*.ts', ['push:js']);

    // Watch Misc Files:
    gulp.watch('Banding/**/*.{png,jpg,gif,svg,eto,ttf,eot,woff}', ['push:misc']);

    // Watch masterpage: 
    gulp.watch('Build/html/*.html', ['push:masterpage']);

    // Watch webparts:
    gulp.watch('Build/html/webparts/*.html', ['push:webparts']);

    // Watch source code:
    gulp.watch([
        '!sharepoint.config.json',
        '*.{js,json,stylelintrc,rb,.gitignore}'
    ], ['push:source']);

    // Displays a message to the developer that indicates gulp is ready:
    console.log('SharePointBuild2013 now waiting for changes...');
});




/**
 * Gulp's css task.
 *
 * - Lints and compiles all scss code to css and outputs an unminified and 
 *   a minified version to the Build folder.
 */

gulp.task('compile:css', function(){
    return gulp.src('./Build/sass/**/*.scss')
        
        // Stylelint scss files:
        .pipe(postcss([
                require('stylelint'),
                require('postcss-reporter')({ clearMessage: true }),
            ], 
            { syntax: require('postcss-scss') }
        ))

        // Compiles scss code to pure css:
        .pipe(compass({
            config_file: './config.rb',
            css: 'Branding/css',
            sass: 'Build/sass',
            environment: 'development'
        }))

        // While still compiling, add cross browser prefixes 
        // and combine all media queries:
        .pipe(postcss([
            require('autoprefixer')({ browsers: ['last 2 versions'] }),
            require('css-mqpacker')
        ]))

        // Saves an unminified copy of the results:
        .pipe(gulp.dest('./Branding/css'))

        // Minifys the results:
        .pipe(postcss([
            require('cssnano')
        ]))

        // Adds .min.css to the extension:
        .pipe(rename({
            extname: '.min.css'
        }))

        // Saves the minified results:
        .pipe(gulp.dest('./Branding/css'))
});




/**
 * Gulp's js task.
 *
 * - Lints all TypeScript Files before running Webpack.
 *
 * - See the ./webpack.config.js file to view JavaScript Compiling options. 
 */

gulp.task('compile:js', function(){
    return gulp.src('./Build/ts/**/*.ts')

        // Lint TypeScript:
        .pipe(tslint())

        // Prints tslint results to the console:
        .pipe(tslint.report('verbose'), {
            emitError: false
        })

        .on('error', function(){})

        // Executes the webpack javascript module builder:
        .pipe(webpack(require('./webpack.config.js')))

        // Saves all minified results into the Build/js directory:
        .pipe(gulp.dest('./Branding/js'))
});




/**
 * Gulp's brand css task.
 *
 * - Pushes all css files content to the branding folder.
 */

gulp.task('push:css', ['compile:css'], function(){
    return gulp.src('./Branding/**/*.css')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding,
            flatten     : false
        }))
});



/**
 * Gulp's brand javascript task.
 *
 * - Pushes all javascript files to the branding folder.
 */

gulp.task('push:js', ['compile:js'], function(){
    return gulp.src('./Branding/**/*.{js,map}')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding,
            flatten     : false
        }))
});




/**
 * Gulp's brand files task.
 *
 * - Pushes all other file changes to the branding folder.
 */

gulp.task('push:misc', function(){
    return gulp.src('./Branding/**/*.{png,jpg,gif,svg,eto,ttf,eot,woff}')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding,
            flatten     : false
        }))
});




/**
 * Gulp's masterpage task.
 *
 * - Pushes masterpage and page layouts to the sharepoint site.
 */

gulp.task('push:masterpage', function(){
    return gulp.src('./Build/html/*.html')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.masterpage,
            flatten     : false
        }))
});




/**
 * Gulp's webpart task.
 *
 * - Pushes masterpage and page layouts to the sharepoint site.
 */

 gulp.task('push:webparts', function(){
    return gulp.src('./Build/html/webparts/**/*.html')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.webparts,
            flatten     : false
        }))
});




/**
 * Gulp's config task.
 *
 * - Pushes all local configuration files to the sharepoint site.
 *
 * - This includes all typescript and SASS files in the build folder.
 *
 * - This does not inlcude the sharepoint.config.json file for 
 *   security reasons.
 */

gulp.task('push:source', function(){
    return gulp.src([
        '!sharepoint.config.json',
        '*.{js,json,stylelintrc,rb,.gitignore}',
        'Build/**/*.{ts,scss}'
    ])

    // Logs any connection errors to the console:
    .pipe(plumber({
        errorHandler: onError
    }))

    // Pushes changes to the sharepoint site:
    .pipe(spsave({
        username    : sp.username,
        password    : sp.password,
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.config,
        flatten     : false
    }))
});




/**
 * Gulp's Push to SharePoint task.
 *
 * - Pushes all local changes to the SharePoint site combining
 *   the functionality of all tasks.
 */

gulp.task('sharepoint', ['push:css', 'push:js', 'push:webparts', 'push:misc', 'push:masterpage', 'push:source']);