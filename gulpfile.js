const { src, dest, parallel, series, watch } = require('gulp');
const clean = require('gulp-clean');
const browserSync = require('browser-sync').create();

const imagecomp = require('compress-images');
// const newer = require('gulp-newer');
// const imagemin = require('gulp-imagemin');
// const imageminJpegRecompress = require('imagemin-jpeg-recompress');
// const pngquant = require('imagemin-pngquant');
const webp = require('gulp-webp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const csso = require('gulp-csso');
const rename = require("gulp-rename");
const gcmq = require('gulp-group-css-media-queries');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');
const nunjucks = require('gulp-nunjucks');

const sourceFolder = 'app/';
const distFolder = 'dist/';
const sourceImg = sourceFolder + 'img_src/';
const distImg = sourceFolder + 'img/';

// *** Подготовка каталога для сборки ***

function cleandist() {
  return src(distFolder, {allowEmpty: true}).pipe(clean())
}

function browsersync(done) {
  browserSync.init({ // Initiolized Browsersync
    server: { baseDir: sourceFolder }, // Source files folder
    notify: false, // Turned off notificasions
    online: true // Working mode: true or false
  });
  done();
}

// *** Изображения и спрайты ***

async function imageMin() {
  imagecomp(
    sourceImg + '**/*',
    distImg,
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

// function imageMin(){
//   return src(sourceImg + '**/*.*')
//       .pipe(newer(distImg))
//       .pipe(imagemin([

//           imageminJpegRecompress({
//               progressive: true,
//               min: 70, max: 75
//           }),

//           pngquant({
//               speed: 5,
//               quality: [0.6, 0.8]
//           }),

//           imagemin.svgo({
//               plugins: [
//                       { removeViewBox: false },
//                       { removeUnusedNS: false },
//                       { removeUselessStrokeAndFill: false },
//                       { cleanupIDs: false },
//                       { removeComments: true },
//                       { removeEmptyAttrs: true },
//                       { removeEmptyText: true },
//                       { collapseGroups: true }
//               ]
//           })

//       ]))
//       .pipe(dest(distImg))
// }

function webpConverter(){
  return src(distImg + '**/*.{png,jpg,jpeg}')
      .pipe(webp())
      .pipe(dest(distImg))
}

// *** JS ***

function scripts() { // Concatination and minified js
  return src([ // Source files list
    'node_modules/jquery/dist/jquery.min.js', // Connect jquery library (example)
    sourceFolder + 'js/app.js', // User's script using library
    ])
  .pipe(concat('app.min.js')) // Concatination to one file
  .pipe(uglify()) // Compressed JavaScript
  .pipe(dest(sourceFolder + 'js/')) // Put result to distination folder
  .pipe(browserSync.stream()) // Reload Browsersync
}

// *** Styles ***

function styles(){
  return src(sourceFolder + 'sass/main.scss')
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(autoprefixer({
          grid: true
      }))
      .pipe(gcmq())
      .pipe(sourcemaps.write())
      .pipe(rename('app.css'))
      .pipe(dest(sourceFolder + 'css/'))
      .pipe(csso())
      .pipe(rename('app.min.css'))
      .pipe(dest(sourceFolder + 'css/'))
      .pipe(browserSync.reload({stream: true}))
}

// *** Fonts ***

function ttf2woff2Converter(){
  return src(sourceFolder + 'fonts/*.ttf')
      .pipe(ttf2woff2())
      .pipe(dest(sourceFolder + 'fonts/'));
}

function ttf2woffConverter(){
  return src(sourceFolder + 'fonts/*.ttf')
      .pipe(ttf2woff())
      .pipe(dest(sourceFolder + 'fonts/'));
}

function otf2ttf(){
  return src(sourceFolder + 'fonts/*.otf')
      .pipe(fonter({
          formats: ['ttf']
      }))
      .pipe(dest(sourceFolder + 'fonts/'));
}

const fontsConverter = series(otf2ttf, ttf2woff2Converter);

// *** HTML ***

function njk(){
  return src(sourceFolder + 'html_src/*.html')
    .pipe(nunjucks.compile())
    .pipe(dest(sourceFolder))
};

const htmlBuild = series(njk);

// *** Сборка и запуск ***

function buildcopy() {
  return src([
    `${distImg}**/*`, `!${sourceImg}**/*`,
    sourceFolder + 'js/**/*.min.js',
    sourceFolder + 'css/**/*.min.css',
    sourceFolder + 'fonts/**/*',
    `${sourceFolder}**/*.html`, `!${sourceFolder}html_src/**/*`,
    ], { base: sourceFolder })
  .pipe(dest(distFolder))
}

function startwatch() {
  watch(`${sourceImg}**/*`, images);
  watch([`${sourceFolder}**/*.js`, `!${sourceFolder}**/*.min.js`], scripts);
  watch(sourceFolder + '**/sass/**/*.scss', styles);
  watch(sourceFolder + '**/*.html').on('change', browserSync.reload);
}

exports.cleandist = cleandist;
exports.browsersync = browsersync;

exports.imageMin = imageMin;
exports.webp = webpConverter;
exports.scripts = scripts;
exports.styles = styles;
exports.html = htmlBuild;

exports.fonts = fontsConverter;

exports.default = series(
  imageMin,
  parallel(scripts, styles, htmlBuild),
  webpConverter,
  parallel(browsersync, startwatch)
);
exports.build = series(webpConverter, cleandist, buildcopy);
