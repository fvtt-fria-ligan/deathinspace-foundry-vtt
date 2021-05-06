const concat = require('gulp-concat');
const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');


/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

gulp.task('sass', function () {
  return gulp.src('source/**/*.scss')
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(prefix({
      cascade: true
    }))
    .pipe(concat('deathinspace.css'))
    .pipe(gulp.dest('./css'))
})

gulp.task('watch', gulp.series(['sass'], () => {
  gulp.watch('source/**/*.scss', gulp.series(['sass']))
}))