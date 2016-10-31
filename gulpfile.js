/**
 * gulpfile.js
 *
 * - Handles all build tool tasks which can be called by the command line.
 */

var gulp          = require('gulp'),
    path          = require('path'),
    sp            = require('./sharepoint.config.json'),
    sppull        = require('sppull').sppull,
    colors        = require('colors'),
    del           = require('del'),
    onError       = function (err){
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
        '*.{rb,json}'
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

        // Compiles scss code to pure css:
        .pipe(sass())

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
 * - See the ./webpack.config.js file to view JavaScript Compiling options. 
 */

gulp.task('compile:js', function(){
    return gulp.src('./Build/ts/**/*.ts')

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
            folder      : sp.dir.branding,
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
 *
 * - All .json files aren't being pulled from the site correctly,
 *   to fix this, all config files will be converted to .xml
 *   and will be converted back when pulled.
 */

gulp.task('push:config', function(){
    return gulp.src([
        'typings.json',
        'bower.json',
        'package.json'
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
 * Object: spPullCreds
 *
 * - Supplies login credentials to the sppull argument.
 */

var spPullCreds = {
    username: sp.username,
    password: sp.password,
    siteUrl: sp.siteUrl
};




/**
 * Functions: onPullComplete(files), onPullError(err)
 *
 * - Default actions passed to sppull promise. 
 */

var onPullComplete = function(files){
    // Tells the user which files have been downloaded, and where they have been saved:
    for (var i = 0, l = files.length; i < l; i++){
        console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);
    }
}

var onPullError = function(err){
    console.log(err.red);
}




/**
 * Gulp's Pull from SharePoint Tasks.
 *
 * - Pulls the custom.html masterpage from the sharepoint site.
 */

gulp.task('pull:masterpage', function(){

    sppull(spPullCreds, {
            spRootFolder: sp.dir.masterpage,
            dlRootFolder: './Build/html',
            strictObjects: [
                '/custom.html'
            ]
        }
    ).then(onPullComplete)
     .catch(onPullError);
});




/**
 * Gulp's Pull webpart tasks.
 *
 * - Pulls webpart files from the SiteAssets folder on the
 *   sharepoint site.  This includes the .html and .min.js
 *   files for each of the webparts.
 *
 * - Downloads all files into a temp folder, the promise
 *   will then distribute the files to the correct location.
 */

gulp.task('pull:webparts', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.webparts,
        dlRootFolder: './webpartsTemp'
    })
    .then(function(files){ 

        // Loops through each webpart file being downloaded:
        for (var i = 0, l = files.length; i < l; i++){

            // Lets the user know which files are being downloaded to where.
            // Each file will be placed into a temporary folder:
            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);

            // IIFE: Move the file out of the temporary folder based off of their extensions:
            (function(localPath){

                if (/\.html$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Build/html/webparts', {overwrite: true}))
                } else {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/js/webparts', {overwrite: true}))
                }

            }(files[i].SavedToLocalPath));
        }
        
        // Removes the temporary folder:
        del('./webpartsTemp');
    })
    .catch(onPullError);
});




/**
 * Gulp's Pull css task.
 *
 * - Pulls style files from the Branding folder 
 *   on the sharepoint site.  This includes the 
 *   .css and .scss files for the entire site 
 *   (webparts, main theme styles, all styles)
 *   
 * - Downloads all files into a temp folder, the promise
 *   will then distribute the files to the correct location.
 */

gulp.task('pull:css', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/css',
        dlRootFolder: './cssTemp'
    })
    .then(function(files){

        for (var i = 0, l = files.length; i < l; i++){

            // Lets the user know which files are being downloaded to where.
            // Each file will be placed into a temporary folder:
            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);

            (function(localPath){

                if (/\.css$/.test(localPath) || /\.map$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/css', {overwrite: true}))
                
                } else {

                    // For sass files, the directories must be set explicitly for each of them:
                    var sassDir = './Build' + localPath.replace(/\.\/cssTemp\//, '');
                    return gulp.src(localPath)
                        .pipe(gulp.dest(sassDir.substring(0, sassDir.lastIndexOf('/')), {overwrite: true}))
                }

            }(files[i].SavedToLocalPath));
        }

        // Removes the temporary folder:
        del('./cssTemp');
    })
    .catch(onPullError)
});




/**
 * Gulp's Pull JS task.
 *
 * - Pulls JavaScript files from the Branding folder
 *   on the sharepoint site.  This includes .js files
 *   that are loaded in the masterpage and all .ts files 
 *   for the entire site (including .ts files for webparts)
 *
 * - Downloads all files into a temp folder, the promise
 *   will then distribute the files to the correct location.
 */

gulp.task('pull:js', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/js',
        dlRootFolder: './jsTemp'
    })
    .then(function(files){

        for (var i = 0, l = files.length; i < l; i++){

            // Lets the user know which files are being downloaded to where.
            // Each file will be placed into a temporary folder:
            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);

            (function(localPath){

                if (/\.js$/.test(localPath) || /\.map$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/js', {overwrite: true}))
                } else {

                    // For ts files, the directories must be set explicitly for each of them:
                    var tsDir = './Build' + localPath.replace(/\.\/jsTemp\//, '');
                    return gulp.src(localPath)
                        .pipe(gulp.dest(tsDir.substring(0, tsDir.lastIndexOf('/')), {overwrite: true}))
                }

            }(files[i].SavedToLocalPath));
        }

        // Removes the temporary folder:
        del('./jsTemp');
    })
    .catch(onPullError)
});




/**
 * Gulp's Pull 
 *
 * - This section is still in beta.
 *
 * - Pulls json files that contain a list of project dependencies.
 */

gulp.task('pull:config', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/config',
        dlRootFolder: './',
        strictObjects: [
            '/package.json',
            '/bower.json',
            '/typings.json'
        ]
    })
    .then(onPullComplete)
    .catch(onPullError)
});




/**
 * Gulp's Pull libraries task.
 *
 * - Pulls all 3rd party libraries being used by the sharepoint site.
 */

gulp.task('pull:libraries', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/libraries',
        dlRootFolder: './Branding/libraries'
    })
    .then(onPullComplete)
    .catch(onPullError)
});



/**
 * Gulp's Pull images task.
 *
 * - Pulls all image files from the Branding folder.
 */

gulp.task('pull:images', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/images',
        dlRootFolder: './Branding/images'
    })
    .then(onPullComplete)
    .catch(onPullError)
});



/**
 * Gulp's Pull fonts task.
 *
 * - Pulls all font files from the Branding folder.
 */

gulp.task('pull:fonts', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/fonts',
        dlRootFolder: './Branding/fonts'
    })
    .then(onPullComplete)
    .catch(onPullError)
});
