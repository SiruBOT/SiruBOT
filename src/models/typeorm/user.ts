import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Unique,
} from "typeorm";

@Entity()
@Unique(["discordUserId"])
export class TypeORMUser extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") // Internal id
  uuid: string;

  @Column({ name: "discord_user_id" }) // Discord User ID
  discordUserId: string;

  @Column({ name: "eula_agreed", default: false }) // Is the user agreed to the terms of service?
  eulaAgreed: boolean;

  @Column("simple-array") // Array of IDs of playlists the user has
  ownedPlaylists: number[];

  @Column("simple-array") // Array of ID of playlists the user liked
  likedPlaylists: number[];

  @CreateDateColumn({ name: "created_at" }) // Created at
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" }) // Updated at
  updatedAt: Date;
}
