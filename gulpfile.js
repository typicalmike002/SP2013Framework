/**
 * gulpfile.js
 *
 * - Handles all build tool tasks.
 */

var gulp    = require('gulp'),
    path    = require('path'),
    sp      = require('./sharepoint.config.json'),
    sppull  = require('sppull').sppull,
    colors  = require('colors'),
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

    // Watch for main js:
    gulp.watch('Build/ts/*.ts', ['push:js']);

    // Watch Misc Files:
    gulp.watch('Banding/{images,fonts}/*.{png,jpg,gif,svg,eto,ttf,eot,woff}', ['push:misc']);

    // Watch masterpage: 
    gulp.watch('Build/html/*.html', ['push:masterpage']);

    // Watch webparts:
    gulp.watch([
        'Build/html/webparts/*.html',
        'Build/ts/webparts/*.ts'
    ], ['push:webparts']);

    // Watch config code:
    gulp.watch([
        '!sharepoint.config.json',
        '*.{js,json,stylelintrc,rb,.gitignore}'
    ], ['push:config']);

    // Watch libraries:
    gulp.watch('Branding/libraries/**/*.js', ['push:libraries']);

    // Displays a message to the developer that indicates gulp is ready:
    console.log('SharePointBuild2013 now waiting for changes...');
});




/**
 * Gulp's compile css task.
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
 * Gulp's compile js task.
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

        // This empty function allows gulp to continue the stream
        // if tslint reports an error.  It is blank because we are 
        // using tslint.report() above this message to log the errors:
        .on('error', function(){})

        // Executes the webpack javascript module builder:
        .pipe(webpack(require('./webpack.config.js')))

        // Saves all minified results into the Build/js directory:
        .pipe(gulp.dest('./Branding/js'))
});




/**
 * Gulp's push css task.
 *
 * - Pushes all css files content to the branding folder.
 */

gulp.task('push:css', ['compile:css', 'push:sass'], function(){
    return gulp.src('./Branding/css/*.css')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/css/',
            flatten     : false
        }))
});



/**
 * Gulp's push javascript task.
 *
 * - Pushes all javascript files to the branding folder.
 */

gulp.task('push:js', ['compile:js', 'push:ts'], function(){
    return gulp.src('./Branding/js/*.{js,map}')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/js/',
            flatten     : false
        }))
});




/**
 * Gulp's push libraries task.
 *
 * - Pushes all libraries to the branding folder.
 */

gulp.task('push:libraries', function(){

    return gulp.src('./Branding/libraries/**/*.js')

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Pushes changes to the sharepoint site:
        .pipe(spsave({
            username    : sp.username,
            password    : sp.password,
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/libraries/',
            flatten     : false
        }))
});




/**
 * Gulp's push misc files task.
 *
 * - Pushes all other file changes to the branding folder.
 *
 * - Handles images, fonts, and other file formats.
 */

gulp.task('push:misc', function(){
    return gulp.src('./Branding/{images,fonts}/**/*.{png,jpg,gif,svg,eto,ttf,eot,woff}')

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
 * - Pushes webparts to the SiteAssets folder.
 *
 * - The folder will be determined by the file name.
 *   Make sure the .js file name matches .html 
 */

 gulp.task('push:webparts', ['compile:js', 'push:ts'], function(){

    return gulp.src([
            './Build/html/webparts/**/*.html',
            './Branding/js/webparts/*.{js,map}'
        ])

        // Logs any connection errors to the console:
        .pipe(plumber({
            errorHandler: onError
        }))

        // Each webpart will be saved to a folder that shares a name with 
        // the name of the files without the extension.
        .pipe(tap(function(file){
            var webpartFolder = path.basename(file.path).replace(/\.(.*?)$/, '');
            return gulp.src(file.path)
                .pipe(spsave({
                    username    : sp.username,
                    password    : sp.password,
                    siteUrl     : sp.siteUrl,
                    folder      : sp.dir.webparts + '/' + webpartFolder,
                    flatten     : false
                }))
        }))
});




/**
 * Gulp's config task.
 *
 * - Pushes all local configuration files to the SiteAssets folder.
 *
 * - This does not inlcude the sharepoint.config.json 
 */

gulp.task('push:config', function(){
    return gulp.src([
        '!sharepoint.config.json',
        '*.{js,json,stylelintrc,rb,gitignore,bowerrc}',
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
        folder      : sp.dir.branding + '/config/',
        flatten     : false
    }))
});




/**
 * Gulp's push TS task.
 *
 * - Pushes all TS files to the SiteAssets folder.
 */

gulp.task('push:ts', function(){
    return gulp.src(['Build/ts/**/*.ts'])

    // Logs any connection errors to the console:
    .pipe(plumber({
        errorHandler: onError
    }))

    // Pushes changes to the sharepoint site:
    .pipe(spsave({
        username    : sp.username,
        password    : sp.password,
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.branding + '/js/ts/',
        flatten     : false
    }))
});




/**
 * Gulp's push SASS task.
 *
 * - Pushes all SASS files to the SiteAssets folder.
 */

gulp.task('push:sass', function(){
    return gulp.src(['Build/sass/**/*.scss'])

    // Logs any connection errors to the console:
    .pipe(plumber({
        errorHandler: onError
    }))

    // Pushes changes to the sharepoint site:
    .pipe(spsave({
        username    : sp.username,
        password    : sp.password,
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.branding + '/css/sass/',
        flatten     : false
    }))
});




/**
 * Gulp's Push to SharePoint task.
 *
 * - Pushes all local changes to the SharePoint site combining
 *   the functionality of all tasks.
 */

gulp.task('push:sharepoint', ['push:css', 'push:js', 'push:webparts', 'push:misc', 'push:masterpage', 'push:config']);




/**
 * Gulp's Pull from SharePoint Tasks.
 *
 * - This section is in beta.
 *
 * - Due to a bug in the sppull module, we have to manually set the url path 
 *   from within strictObjects to pull the custom.html masterpage.
 */

gulp.task('pull:masterpage', function(){

    sppull({
            username: sp.username,
            password: sp.password,
            siteUrl: sp.siteUrl
        }, {
            spRootFolder: sp.dir.masterpage,
            dlRootFolder: './Build/html',
            strictObjects: [
                '/' + sp.dir.collection + '/' + sp.dir.masterpage + '/' + 'custom.html'
            ]
        }
    ).then(function(file){
        for (var i = 0, l = file.length; i < l; i++){
        
            // Tells the user which files have been downloaded, and where they have been saved:
            console.log(file[i].ServerRelativeUrl.green + ' has been downloaded into ' + file[i].SavedToLocalPath.green);
        }
    }).catch(function(err){
        console.log(err.red);
    });
});
