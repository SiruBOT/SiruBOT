import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
  Unique,
} from "typeorm";

@Entity()
@Unique(["id"])
export class Metrics extends BaseEntity {
  @PrimaryGeneratedColumn("increment") // Internal id
  id: number;

  @Column({
    type: "int",
    name: "playing_players",
    nullable: false,
    default: 0,
  })
  playingPlayers: number;

  @Column({
    type: "int",
    name: "shard_guild_count",
    nullable: false,
    default: 0,
  })
  shardGuildCount: number;

  @Column({
    type: "int",
    name: "websocket_ping",
    nullable: false,
    default: 0,
  })
  websocketPing: number;

  @Column("simple-array")
  shardIds: number[];

  @Column("int")
  clusterId: number;

  @CreateDateColumn({ name: "created_at" }) // Created at
  createdAt: Date;
}
