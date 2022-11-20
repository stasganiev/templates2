const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;

function browsersync(done) {
  browserSync.init({ // Initiolized Browsersync
    server: { baseDir: 'app/' }, // Source files folder
    notify: false, // Turned off notificasions
    online: true // Working mode: true or false
  });
  done();
}

function scripts() { // Concatination and minified js
  return src([ // Source files list
    'node_modules/jquery/dist/jquery.min.js', // Connect jquery library (example)
    'app/js/app.js', // User's script using library
    ])
  .pipe(concat('app.min.js')) // Concatination to one file
  .pipe(uglify()) // Compressed JavaScript
  .pipe(dest('app/js/')) // Put result to distination folder
  .pipe(browserSync.stream()) // Reload Browsersync
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.default = parallel(scripts, browsersync, startwatch);
