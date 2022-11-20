let preprocessor = 'sass';
const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');

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

function sass() {
	return src('app/sass/main.scss')
	.pipe(eval('sass')())
	.pipe(concat('app.min.css'))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Minimize
	.pipe(dest('app/css/'))
	.pipe(browserSync.stream())
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
  watch('app/**/sass/**/*.scss', sass);
  watch('app/**/*.html').on('change', browserSync.reload);
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.default = parallel(sass, scripts, browsersync, startwatch);
