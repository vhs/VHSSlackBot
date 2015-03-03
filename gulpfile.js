"use strict";

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var packageJSON  = require('./package');
var jshintConfig = packageJSON.jshintConfig;

gulp.task('lint', function() {
    return gulp.src(['./*.js', 'routes/**/*.js', 'test/**/*.js'])
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter(stylish));
});

gulp.task('unittest', function () {
    process.env.NODE_ENV = "test";
    return gulp.src('test/*.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('test', ['unittest']);

gulp.task('default', ['lint', 'test']);