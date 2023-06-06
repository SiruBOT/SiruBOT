// |Good parts:
// |- The code uses the `execSync` function from the `child_process` module to execute Git commands synchronously.
// |- The `getGitHash` function returns the abbreviated hash of the latest Git commit.
// |- The `getGitBranch` function returns the name of the current Git branch.
// |
// |Bad parts:
// |- The code assumes that Git is installed and available in the system path, which may not always be the case.
// |- The code does not handle errors that may occur when executing Git commands, which can lead to unexpected behavior or crashes.
// |- The code does not provide any way to customize the Git command or its arguments, which may limit its usefulness in certain scenarios.
// |
import { execSync } from "node:child_process";

export function getGitHash(): string {
  return execSync(`git log -1 --pretty=format:"%h"`).toString().trim();
}

export function getGitBranch(): string {
  return execSync(`git rev-parse --abbrev-ref HEAD`).toString().trim();
}
