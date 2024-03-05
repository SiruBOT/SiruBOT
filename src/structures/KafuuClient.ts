import Discord from "discord.js";
import FastGlob from "fast-glob";
import * as Sentry from "@sentry/node";
import type Cluster from "discord-hybrid-sharding";
import type { Logger } from "tslog";

import { BaseCommand } from "./";
import { AudioHandler } from "./audio/AudioHandler";
import { BaseEvent, DatabaseHelper } from "./";

import type { KafuuBootStrapperArgs } from "@/types/bootstrapper";
import { MESSAGE_CACHE_SWEEPER_INTERVAL } from "@/constants/time";
import { ClientStats } from "@/types/stats";
import { KafuuSettings } from "@/types/settings";
import { generateGlobPattern } from "@/utils/formatter";
import { join as joinPath } from "path";

class KafuuClient extends Discord.Client {
  public settings: KafuuSettings;
  public bootStrapperArgs: KafuuBootStrapperArgs;

  public cluster?: Cluster.ClusterClient<this>;
  public log: Logger;

  public commands: Discord.Collection<string, BaseCommand>;
  public events: Discord.Collection<
    string,
    BaseEvent<keyof Discord.ClientEvents>
  >;
  public databaseHelper: DatabaseHelper;
  public audio: AudioHandler;

  public constructor(
    clientOptions: Discord.ClientOptions,
    log: Logger,
    botSettings: KafuuSettings,
    bootStrapperArgs: KafuuBootStrapperArgs,
  ) {
    // Discord#ClientOptions
    super({
      ...clientOptions,
      sweepers: {
        messages: {
          interval: MESSAGE_CACHE_SWEEPER_INTERVAL,
          filter: () => {
            return (
              value: Discord.Message<boolean>,
              key: string,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              _collection: Discord.Collection<string, Discord.Message<boolean>>,
            ) => {
              return value.guildId
                ? this.audio.dispatchers.get(value.guildId)?.audioMessage
                    .nowplayingMessage?.id != key
                : true;
            };
          },
        },
      },
    });
    this.settings = botSettings;
    this.bootStrapperArgs = bootStrapperArgs;
    this.log = log;

    this.commands = new Discord.Collection<string, BaseCommand>();
    this.events = new Discord.Collection<
      string,
      BaseEvent<keyof Discord.ClientEvents>
    >();
    this.databaseHelper = new DatabaseHelper(this);
  }

  // Setup bot database, load commands, connect lavalink nodes.. setup audio..p
  public async start(): Promise<void> {
    this.log.debug("Setup client audio, commands & events, database...");
    try {
      this.audio = new AudioHandler(this);
      await this.loadCommands();
      await this.loadEvents();
      await this.databaseHelper.setup();
      this.log.info("Client setup complete, logging in...");
      await this.login(this.settings.bot.token);
    } catch (err) {
      Sentry.captureException(err);
      throw err;
    }
  }

  // When unhandled event error, log it and send it to Sentry
  private warpEventFunc(
    eventInstance: BaseEvent<keyof Discord.ClientEvents>,
  ): (
    ...args: Discord.ClientEvents[keyof Discord.ClientEvents]
  ) => Promise<void> {
    return async (
      ...args: Discord.ClientEvents[keyof Discord.ClientEvents]
    ) => {
      try {
        await eventInstance.run(...args);
      } catch (err) {
        this.log.error("Unhandled event error from " + eventInstance.name);
        this.log.error(err);
        Sentry.captureException(err);
        Sentry.captureException(
          new Error("Unhandled event error from " + eventInstance.name),
        );
      }
    };
  }

  private async loadEvents() {
    const eventsPattern: string = generateGlobPattern(
      joinPath(__dirname, "../"),
      "events",
    );
    this.log.debug("Loading events with pattern: " + eventsPattern);
    const events: string[] = await FastGlob(eventsPattern);
    this.log.info(`Found ${events.length} events.`);

    for (const eventPath of events) {
      const EventClass = await import(eventPath);
      if (!EventClass.default)
        throw new Error("Event file is missing default export\n" + eventPath);

      const eventInstance: BaseEvent<keyof Discord.ClientEvents> =
        new EventClass.default(this);
      if (!(eventInstance instanceof BaseEvent))
        throw new Error("Event file is not extends BaseEvent\n" + eventPath);

      const eventFunc = this.warpEventFunc(eventInstance);
      this.on(eventInstance.name, eventFunc);
      this.events.set(eventInstance.name, eventInstance);
    }
  }

  private async loadCommands() {
    const commandsPattern: string = generateGlobPattern(
      joinPath(__dirname, "../"),
      "commands",
    );

    this.log.debug("Loading commands with pattern: " + commandsPattern);
    const commandFiles: string[] = await FastGlob(commandsPattern);
    this.log.info(`Found ${commandFiles.length} commands`);

    // Register commands to this.commands <CommandName, BaseCommand>
    for (const commandPath of commandFiles) {
      this.log.debug(`Process command ${commandPath}`);
      const CommandClass = await import(commandPath);
      // Command file validation
      if (!CommandClass.default)
        throw new Error(
          "Command file is missing default export\n" + commandPath,
        );
      const commandInstance: BaseCommand = new CommandClass.default(this);
      if (!(commandInstance instanceof BaseCommand))
        throw new Error(
          "Command file is not extends BaseCommand\n" + commandPath,
        );
      this.commands.set(commandInstance.slashCommand.name, commandInstance);
    }
  }

  private statsInfo(): ClientStats {
    return {
      discordStats: {
        cachedGuilds: this.guilds.cache.size,
        cachedUsers: this.users.cache.size,
        cachedChannels: this.channels.cache.size,
      },
      shardIds: this.shard?.ids ?? [0],
      audioStats: {
        audioDispatchers: this.audio.dispatchers.size,
        audioNodes: [...this.audio.nodes.values()].map((e) => {
          return {
            stats: e.stats,
            info: e.info,
          };
        }),
      },
      websocketStatus: {
        wsStatus: this.ws.status,
        wsLatency: this.ws.ping,
      },
    };
  }
}

export { KafuuClient };
