import { EmbedBuilder, EmbedFooterOptions } from "discord.js";
import { isDev } from "./index";
import { versionInfo } from "./version";
import { WARN_COLOR } from "./constants";

export class ExtendedEmbedBuilder extends EmbedBuilder {
  public override setFooter(options: EmbedFooterOptions | null) {
    return super.setFooter({
      ...options,
      text: `${options?.text ? `${options?.text} • ` : ""}치노봇 ${isDev ? `${versionInfo.getGitBranch()}/${versionInfo.getGitHash()}` : `${versionInfo.getVersion()} (${versionInfo.getGitHash()})`}`,
    });
  }
}

export function buildErrorEmbed(error: string) {
  return new ExtendedEmbedBuilder()
    .setColor(WARN_COLOR)
    .setDescription(`**${error}**`);
}
