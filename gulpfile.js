const gulp = require("gulp");
const del = require("del");
const log = require("fancy-log");

gulp.task("clean", () => {
  log("Clean build directory...")
  return del("build/**/*")
})