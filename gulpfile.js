const gulp = require("gulp");
const del = require("del")
const ts = require("gulp-typescript");
const log = require("fancy-log");
const tsProject = ts.createProject("tsconfig.json");

gulp.task("clean", () => {
  log("Clean dist folder");
  return del(tsProject.config.compilerOptions.outDir)
})
