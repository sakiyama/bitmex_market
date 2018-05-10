var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var clean = require('gulp-clean');

var allJsSource = [ 'src/*.js', 'src/**/*' ];

// https://stackoverflow.com/questions/22824546/how-to-run-gulp-tasks-sequentially-one-after-the-other
// 3.9.1 here
gulp.task('clean', function() {
	gulp.src('dist/**/*', {read: false})
		.pipe(clean());
});
gulp.task('babel', function() {
	gulp.src(allJsSource)
		.pipe(plumber())
		.pipe(babel())
		.pipe(gulp.dest('dist'));
});
gulp.task('watch', function() {
	gulp.watch(allJsSource, ['babel']);
});

gulp.task('build', [ 'babel' ]);
gulp.task('default', [ 'babel', 'watch' ]);