import Discord from "discord.js";
import { KafuuClient } from "../KafuuClient";
import { format } from "@/locales";

class AudioTimer {
  private timers: Discord.Collection<string, NodeJS.Timeout>;
  private client: KafuuClient;
  private timeout: number;

  constructor(client: KafuuClient, timeout: number) {
    this.timers = new Discord.Collection();
    this.client = client;
    this.timeout = timeout;
  }

  public createTimer(guildId: string) {
    this.client.log.debug("[AudioTimer] Creating timer for guild ", guildId);
    const timer = setTimeout(async () => {
      const player = this.client.audio.players.get(guildId);
      if (!player || !player.connection.channelId) {
        this.client.log.debug(
          `[AudioTimer] Player not found or connection not found in guild ${guildId}`,
        );
        this.deleteTimer(guildId);
        return;
      }
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        this.deleteTimer(guildId);
        await this.client.audio.dispatchers.get(guildId)?.stopPlayer(true);
        this.client.log.debug(
          `[AudioTimer] Guild not found in guild ${guildId}`,
        );
        return;
      }
      const channel = await guild.channels.fetch(player.connection.channelId);
      if (!channel || !channel.isVoiceBased()) {
        this.deleteTimer(guildId);
        await this.client.audio.dispatchers.get(guildId)?.stopPlayer(true);
        this.client.log.debug(
          `[AudioTimer] Channel not found in guild ${guildId}`,
        );
        return;
      }
      if (
        channel.members
          .filter((e) => !e.user.bot)
          .filter((e) => !e.voice.selfDeaf).size <= 0
      ) {
        this.deleteTimer(guildId);
        this.client.audio.dispatchers
          .get(guildId)
          ?.audioMessage.sendRaw(
            format(Discord.Locale.Korean, "VOICE_TIMEOUT"),
          );
        await this.client.audio.dispatchers.get(guildId)?.stopPlayer(true);
        return;
      } else {
        this.deleteTimer(guildId);
      }
    }, this.timeout);

    this.timers.set(guildId, timer);
  }

  public deleteTimer(guildId: string) {
    this.client.log.debug("[AudioTimer] Deleting timer for guild ", guildId);
    const timer = this.timers.get(guildId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(guildId);
    }
  }
}

export { AudioTimer };
