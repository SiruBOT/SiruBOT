import {
  ContainerBuilder,
  EmbedBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  SeparatorSpacingSize,
  EmbedFooterOptions,
} from "discord.js";
import { isDev } from "./index";
import { versionInfo } from "./version";
import { DEFAULT_COLOR, WARN_COLOR } from "./constants";

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

export function addSeparator(container: ContainerBuilder): void {
  container.addSeparatorComponents(
    new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small),
  );
}

export function createContainer(): ContainerBuilder {
  const container = new ContainerBuilder();
  container.setAccentColor(DEFAULT_COLOR);
  return container;
}

export function createThumbnail(url: string): ThumbnailBuilder {
  const thumbnail = new ThumbnailBuilder();
  thumbnail.setURL(url);
  return thumbnail;
}
