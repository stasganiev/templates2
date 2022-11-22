const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const imagecomp = require('compress-images');
const clean = require('gulp-clean');

const sourcemaps = require('gulp-sourcemaps');
const csso = require('gulp-csso');
const rename = require("gulp-rename");
const gcmq = require('gulp-group-css-media-queries');

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

function styles(){
  return src('app/sass/main.scss')
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(autoprefixer({
          grid: true
      }))
      .pipe(gcmq())
      .pipe(sourcemaps.write())
      .pipe(rename('app.css'))
      .pipe(dest('app/css/'))
      .pipe(csso())
      .pipe(rename('app.min.css'))
      .pipe(dest('app/css/'))
      .pipe(browserSync.reload({stream: true}))
}

async function images() {
  imagecomp(
    'app/img/src/**/*',
    'app/img/',
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
    'app/img/**/*', '!app/img/src/**/*', '!app/img/dest/**/*',
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

exports.default = parallel(styles, scripts, browsersync, images, startwatch);
exports.build = series(cleandist, styles, scripts, images, buildcopy);
