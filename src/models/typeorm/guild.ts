import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Unique,
} from "typeorm";
import { KafuuRepeatMode } from "@/types/audio";
import { Locale } from "discord.js";

@Entity()
@Unique(["discordGuildId"])
export class TypeORMGuild extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") // Internal id
  uuid: string;

  @Column({ name: "discord_guild_id" }) // Discord Guild ID
  discordGuildId: string;

  @Column({
    type: "text",
    name: "voice_channel_id",
    nullable: true,
    default: null,
  }) // Default voice channel
  voiceChannelId: string | null;

  @Column({
    type: "text",
    name: "text_channel_id",
    nullable: true,
    default: null,
  }) // Default voice channel
  textChannelId: string | null;

  @Column({
    type: "text",
    name: "guild_locale",
    nullable: false,
    default: "ko",
  })
  guildLocale: Locale;

  @Column({ name: "send_audio_messages", default: true }) // Send message when a song updates
  sendAudioMessages: boolean;

  @Column({ type: "text", name: "dj_role_id", nullable: true, default: null }) // DJ Role id
  djRoleId: string | null;

  @Column({ type: "numeric", default: 0 }) // 0 = disabled, 1 = repeat all, 2 = repeat single
  repeat: KafuuRepeatMode;

  @Column({ name: "play_related", default: false }) // Play related songs
  playRelated: boolean;

  @Column({ default: 100 }) // Current volume (0-150, default 100)
  volume: number;

  @CreateDateColumn({ name: "created_at" }) // Created at
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" }) // Updated at
  updatedAt: Date;
}
