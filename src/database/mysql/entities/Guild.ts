import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";

@Entity()
export class Guild extends BaseEntity {
  @PrimaryGeneratedColumn() // Internal id
  id: number;

  @Column() // Discord Guild ID
  discordGuildId: string;

  @Column({ nullable: true }) // Default voice channel
  voiceChannelId: string;

  @Column({ default: true }) // Send message when a song updates
  sendAudioMessages: boolean;

  @Column({ nullable: true }) // DJ Role id
  djRoleId: string;

  @Column({ default: 0 }) // 0 = disabled, 1 = repeat all, 2 = repeat single
  repeat: 0 | 1 | 2;

  @Column({ default: false }) // Play related songs
  playRelated: boolean;

  @Column({ default: 100 }) // Current volume (0-150, default 100)
  volume: number;

  @CreateDateColumn() // Created at
  createdAt: Date;

  @UpdateDateColumn() // Updated at
  updatedAt: Date;
}
