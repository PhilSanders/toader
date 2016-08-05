var gulp = require('gulp'),
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

gulp.task('build', function(){
	return gulp.src('./*.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});
