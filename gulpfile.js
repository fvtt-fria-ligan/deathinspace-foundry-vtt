const concat = require("gulp-concat");
const gulp = require("gulp");
const prefix = require("gulp-autoprefixer");
const pug = require("gulp-pug-3");
const gsass = require("gulp-sass")(require("sass"));

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

gulp.task("sass", function () {
  return gulp
    .src("source/**/*.scss")
    .pipe(
      gsass({
        outputStyle: "expanded",
      }).on("error", gsass.logError)
    )
    .pipe(
      prefix({
        cascade: true,
      })
    )
    .pipe(concat("deathinspace.css"))
    .pipe(gulp.dest("./css"));
});

gulp.task("html", function () {
  return gulp
    .src("source/**/*.pug")
    .pipe(
      pug({
        pretty: true,
        // locals: require('../translation.json')
      })
    )
    .pipe(gulp.dest("./"));
});

gulp.task(
  "watch",
  gulp.series(["sass", "html"], () => {
    gulp.watch("source/**/*.scss", gulp.series(["sass"]));
    gulp.watch(["source/**/*.pug", "source/**/*.js"], gulp.series(["html"]));
  })
);
