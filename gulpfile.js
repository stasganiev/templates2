const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const imagecomp = require('compress-images');
const clean = require('gulp-clean');

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

function styles() {
  return src('app/sass/main.scss')
  .pipe(eval('sass')())
  .pipe(concat('app.min.css'))
  .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
  .pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Minimize
  .pipe(dest('app/css/'))
  .pipe(browserSync.stream())
}

async function images() {
  imagecomp(
    "app/img/src/**/*",
    "app/img/dest/",
    { compress_force: false, statistic: true, autoupdate: true }, false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "75"] } },
    { png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
    function (err, completed) {
      if (completed === true) {
        browserSync.reload()
      }
    }
  )
}

function cleanimg() {
  return src('app/img/dest/', {allowEmpty: true}).pipe(clean())
}

function buildcopy() {
  return src([
    'app/css/**/*.min.css',
    'app/js/**/*.min.js',
    'app/img/dest/**/*',
    'app/**/*.html',
    ], { base: 'app' })
  .pipe(dest('dist'))
}

function cleandist() {
  return src('dist', {allowEmpty: true}).pipe(clean()) // Удаляем папку "dist/"
}

function startwatch() {
  watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
  watch('app/**/sass/**/*.scss', styles);
  watch('app/**/*.html').on('change', browserSync.reload);
  watch('app/img/src/**/*', images);
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.cleanimg = cleanimg;
exports.default = parallel(styles, scripts, browsersync, startwatch);
exports.build = series(cleandist, styles, scripts, images, buildcopy);
