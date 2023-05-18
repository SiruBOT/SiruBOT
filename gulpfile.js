const gulp = require("gulp");
const del = require("del")
const log = require("fancy-log");
const { compilerOptions } = require("./tsconfig.json")

gulp.task("clean", () => {
  log("Clean dist folder");
  return del(compilerOptions.outDir);
})
