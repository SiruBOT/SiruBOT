import Discord from "discord.js";
import { KafuuClient } from "../KafuuClient";

class AudioTimer {
  private timers: Discord.Collection<string, NodeJS.Timeout>;
  private client: KafuuClient;
  private timeout: number;

  constructor(client: KafuuClient, timeout: number) {
    this.timers = new Discord.Collection();
    this.client = client;
    this.timeout = timeout;
  }

  //   createTimer(guildId) {
  //     const timer = setTimeout(async () => {
  //       const guild = this.client.guilds.cache.get(guildId);
  //       if (!guild) return this.clearTimer(guildId);
  //       if (this.isInActive(guild)) {
  //         try {
  //           const guildData = await this.client.database.getGuild(guild.id);
  //           await this.client.audio.utils.sendMessage(
  //             guildId,
  //             this.client.utils.localePicker.get(
  //               guildData.locale,
  //               "AUDIO_PAUSED_INACTIVE"
  //             ),
  //             true
  //           );
  //           this.client.audio.stop(guildId, false);
  //           this.client.logger.debug(
  //             `[AudioTimer] Timer Ended ${this.timeout}ms ${guildId}`
  //           );
  //         } catch {
  //           this.client.logger.warn(
  //             `[AudioTimer] Failed to send TimerEndedMessage ${guildId} is channel is invalid?`
  //           );
  //         }
  //       } else {
  //         this.clearTimer(guildId);
  //       }
  //     }, this.timeout);
  //     this.timers.set(guildId, timer);
  //   }

  //   clearTimer(guildId) {
  //     clearTimeout(this.timers.get(guildId));
  //     this.timers.delete(guildId);
  //   }

  //   chkTimer(guildId) {
  //     const guild = this.client.guilds.cache.get(guildId);
  //     if (this.isInActive(guild)) {
  //       if (this.timers.get(guildId)) return;
  //       this.client.logger.debug(
  //         `[AudioTimer] Timer Started ${this.timeout}ms ${guildId}`
  //       );
  //       this.createTimer(guildId);
  //     }
  //   }

  //   isInActive(guild) {
  //     return (
  //       guild.me.voice.channel &&
  //       ((guild.me.voice.channel.members &&
  //         guild.me.voice.channel.members
  //           .filter((el) => !el.user.bot)
  //           .filter((el) => !el.voice.serverDeaf && !el.voice.selfDeaf).size <=
  //           0) ||
  //         (this.client.audio.players.get(guild.id) &&
  //           !this.client.audio.players.get(guild.id).track))
  //     );
  //   }
}

export { AudioTimer };
