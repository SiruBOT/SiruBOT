import { readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

function getGitHash(): string {
  if (process.env.GIT_HASH) return process.env.GIT_HASH;
  else return execSync(`git log -1 --pretty=format:"%h"`).toString().trim();
}

function getGitBranch(): string {
  if (process.env.GIT_BRANCH) return process.env.GIT_BRANCH;
  else return execSync(`git rev-parse --abbrev-ref HEAD`).toString().trim();
}

class VersionInfo {
  private static instance: VersionInfo;
  private version: string;
  private gitHash: string;
  private gitBranch: string;
  private lavalinkClientVersion: string;
  private djsVersion: string;
  private name: string;

  private constructor() {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    this.gitHash = getGitHash();
    this.gitBranch = getGitBranch();
    this.version = packageJson.version;
    this.name = packageJson.name;
    this.lavalinkClientVersion = packageJson.dependencies["lavalink-client"] || "Unknown";
    this.djsVersion = packageJson.dependencies["discord.js"] || "Unknown";
  }

  public static getInstance(): VersionInfo {
    if (!VersionInfo.instance) {
      VersionInfo.instance = new VersionInfo();
    }
    return VersionInfo.instance;
  }

  public getVersion(): string {
    return this.version;
  }

  public getGitHash(): string {
    return this.gitHash;
  }

  public getGitBranch(): string {
    return this.gitBranch;
  }

  public getLavalinkClientVersion(): string {
    return this.lavalinkClientVersion;
  }

  public getDjsVersion(): string {
    return this.djsVersion;
  }

  public getName(): string {
    return this.name;
  }

  public getNodeVersion(): string {
    return process.version;
  }
}

export const versionInfo = VersionInfo.getInstance();
