/* PLUGINS */
// Gulp
const { src, dest, series, parallel, watch } = require('gulp');

// global plugins
const data = require('gulp-data');
const del = require('del');
const fs = require('fs');

// CSS
const autoprefixer = require('autoprefixer');
const cleancss = require('postcss-clean');
//const combineMediaQuery = require('postcss-combine-media-query');
//const cssnano = require('cssnano');
//const cssVariables = require('postcss-css-variables');
//const failOnWarn = require('postcss-fail-on-warn');
const flexbugsFixes = require('postcss-flexbugs-fixes');
const postcss = require('gulp-postcss');
//const postcssPresetEnv = require('postcss-preset-env');
const sass = require('gulp-sass')(require('sass'));
//const sortMediaQueries = require('postcss-sort-media-queries');

// JS
const uglify = require('gulp-uglify-es').default;

// images
const imagemin = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');
const webp = require('gulp-webp');

// HTML
const htmllint = require('gulp-htmllint');
const htmlmin = require('gulp-htmlmin');
const twig = require('gulp-twig');

// browser sync
const browsersync = require('browser-sync').create();

/* CONFIG */

const paths = {
    out: './public/',
    twigData: './src/twig.json',
};

/* TASKS */

function clearTask(cb) {
    if (fs.existsSync(paths.out)) {
        del(paths.out + '*');
    }

    cb();
}

function htmlTask() {
    return src('./src/**/*.html').pipe(dest(paths.out));
}

function twigTask() {
    return src('./src/**/[^_]*.twig')
        .pipe(
            data(function () {
                if (!fs.existsSync(paths.twigData)) {
                    return {};
                }

                return JSON.parse(fs.readFileSync(paths.twigData));
            })
        )
        .pipe(twig({}))
        .pipe(
            htmlmin({
                caseSensitive: false,
                collapseBooleanAttributes: false,
                collapseInlineTagWhitespace: false,
                collapseWhitespace: true,
                conservativeCollapse: true,
                continueOnParseError: false,
                customAttrAssign: [],
                decodeEntities: false,
                html5: true,
                ignoreCustomFragments: [/<\?(?:[\s\S]*?\?>|[\s\S]*$)/],
                keepClosingSlash: false,
                maxLineLength: 1000,
                minifyCSS: true,
                minifyJS: false, // DON'T TURN THIS ON!
                minifyURLs: false,
                preserveLineBreaks: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeEmptyElements: false,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                sortAttributes: true,
                useShortDoctype: true,
            })
        )
        .pipe(dest(paths.out));
}

function htmllintTask() {
    return src([paths.out + '**/*.html']).pipe(
        htmllint({
            failOnError: true,
        })
    );
}

function fontTask() {
    return src('./src/fonts/**/*').pipe(dest(paths.out + 'fonts'));
}

function imagesTask() {
    return src(['./src/imgs/**/*', '!src/**/icons/**/*']).pipe(dest(paths.out + 'imgs'));
}

function scssTask() {
    return src('./src/styles/*.scss', { sourcemaps: true })
        .pipe(
            sass({
                includePaths: './src/styles',
            })
        )
        .pipe(dest(paths.out + '/styles', { sourcemaps: '.' }));
}

function postcssTask() {
    return src(paths.out + 'styles/*.css')
        .pipe(
            postcss([
                //postcssPresetEnv(),
                // cssVariables({
                //   preserve: false,
                //   preserveAtRulesOrder: true,
                // }),
                // cssnano({
                //     preset: 'default',
                // }),
                cleancss({
                    compatibility: '*',
                    level: {
                        1: {
                            all: true,
                            roundingPrecision: 5,
                            selectorsSortingMethod: 'standard',
                            specialComments: 'all',
                        },
                        2: {
                            all: true,
                            mergeMedia: false,
                            mergeSemantically: false,
                            removeUnusedAtRules: false,
                            restructureRules: false,
                        },
                    },
                }),
                flexbugsFixes(),
                // combineMediaQuery(),
                // sortMediaQueries({
                //   sort: 'desktop-first',
                // }),
                autoprefixer(),
                //failOnWarn(),
            ])
        )
        .pipe(dest(paths.out + 'styles/'));
}

function jsTask() {
    return src('./src/**/*.js', { sourcemaps: true }).pipe(dest(paths.out, { sourcemaps: '.' }));
}

function jsuglifyTask() {
    return src(paths.out + 'scripts/**/*.js')
        .pipe(uglify())
        .pipe(dest(paths.out + 'scripts/'));
}

function svgTask() {
    return src('./src/imgs/icons/**/*.svg')
        .pipe(svgstore())
        .pipe(dest(paths.out + '/imgs'));
}

function browsersyncServe(cb) {
    browsersync.init({
        browser: 'chrome',
        server: {
            baseDir: paths.out,
        },
    });

    cb();
}

function browsersyncReload(cb) {
    browsersync.reload();

    cb();
}

function watchTask() {
    watch(['src/**/*.html'], series(htmlTask, browsersyncReload));
    watch(['src/fonts/**/*'], series(fontTask, browsersyncReload));
    watch(['src/**/*.scss'], series(scssTask, browsersyncReload));
    watch(['src/**/*.js'], series(jsTask, browsersyncReload));
    watch(['src/**/*.twig', paths.twigData], series(twigTask, browsersyncReload));
    watch(['src/imgs/**/*', '!src/**/icons/**/*'], series(imagesTask, browsersyncReload));
    watch(['src/imgs/icons/*'], series(svgTask, browsersyncReload));
}

exports.build = series(clearTask, htmlTask, twigTask, fontTask, scssTask, postcssTask, jsTask, jsuglifyTask, imagesTask, svgTask);

exports.postcss = series(postcssTask);

exports.uglify = series(jsuglifyTask);

exports.lint = series(htmllintTask);

exports.default = series(clearTask, htmlTask, twigTask, fontTask, scssTask, jsTask, imagesTask, svgTask, browsersyncServe, watchTask);
