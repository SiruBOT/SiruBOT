import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn() // Internal id
  id: number;

  @Column() // Discord User ID
  discordUserId: string;

  @Column({ default: false }) // Is the user agreed to the terms of service?
  eulaAgreed: boolean;

  @Column("simple-array") // Array of IDs of playlists the user has
  ownedPlaylists: number[];

  @Column("simple-array") // Array of ID of playlists the user liked
  likedPlaylists: number[];

  @CreateDateColumn() // Created at
  createdAt: Date;

  @UpdateDateColumn() // Updated at
  updatedAt: Date;
}
