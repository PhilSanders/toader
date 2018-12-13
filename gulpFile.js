var gulp = require('gulp'),
    del = require('del'),
    webserver = require('gulp-webserver'),
    useref = require('gulp-useref');

gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
    fallback: 'index.html'
    }));
});

gulp.task('move-assets', function() {
  return gulp.src(['assets/**'])
      .pipe(gulp.dest('dist/assets'))
});

gulp.task('build', ['clean', 'move'], function(){
  return gulp.src('./*.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
  return del(['./dist']);
});

gulp.task('default', function() {
  gulp.run('webserver');
});
