const gulp = require("gulp");
const del = require("del")
const log = require("fancy-log");
const tsProject = require("./tsconfig.json")

gulp.task("clean", () => {
  log("Clean dist folder");
  return del(tsProject.compilerOptions.outDir);
})
