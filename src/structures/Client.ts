import * as Discord from "discord.js";
import path from "path";
import FastGlob from "fast-glob";
import * as Sentry from "@sentry/node";
import { BaseCommand } from "./";
import type Cluster from "discord-hybrid-sharding";
import type { Logger } from "tslog";
import type { IBootStrapperArgs, ISettings } from "../types";
import { AudioHandler } from "./audio/AudioHandler";
import { BaseEvent, DatabaseHelper } from "./";

class Client extends Discord.Client {
  public settings: ISettings;
  public bootStrapperArgs: IBootStrapperArgs;

  public cluster?: Cluster.Client;
  public log: Logger;

  public commands: Discord.Collection<string, BaseCommand>;
  public events: Discord.Collection<string, BaseEvent>;
  public databaseHelper: DatabaseHelper;
  public audio: AudioHandler;

  public constructor(
    clientOptions: Discord.ClientOptions,
    log: Logger,
    botSettings: ISettings,
    bootStrapperArgs: IBootStrapperArgs
  ) {
    // Discord#ClientOptions
    super(clientOptions);
    this.settings = botSettings;
    this.bootStrapperArgs = bootStrapperArgs;
    this.log = log;

    this.commands = new Discord.Collection<string, BaseCommand>();
    this.events = new Discord.Collection<string, BaseEvent>();
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
      this.log.error(err);
      Sentry.captureException(err);
      this.destroy();
      throw new Error("Failed to setup client.");
    }
  }

  public static generateGlobPattern(dirName: string): string {
    return path // Create pattern for dirName files
      .join(__dirname, "..", "..", "src", dirName, "**/*.js")
      .split("\\")
      .join("/");
  }

  // When unhandled event error, log it and send it to Sentry
  private warpEventFunc(
    eventInstance: BaseEvent
  ): (
    ...args: Discord.ClientEvents[keyof Discord.ClientEvents]
  ) => Promise<void> {
    return async (
      ...args: Discord.ClientEvents[keyof Discord.ClientEvents]
    ) => {
      try {
        await eventInstance.run(...args);
        // :thinking:
      } catch (err) {
        this.log.error("Unhandled event error from " + eventInstance.name);
        this.log.error(err);
        Sentry.captureException(err);
        Sentry.captureException(
          new Error("Unhandled event error from " + eventInstance.name)
        );
      }
    };
  }

  private async loadEvents() {
    const eventsPattern: string = Client.generateGlobPattern("events");
    this.log.debug("Loading events with pattern: " + eventsPattern);
    const events: string[] = await FastGlob(eventsPattern);
    this.log.info(`Found ${events.length} events.`);

    for (const eventPath of events) {
      const EventClass = await import(eventPath);
      if (!EventClass.default)
        throw new Error("Event file is missing default export\n" + eventPath);
      const eventInstance: BaseEvent = new EventClass.default(this);
      if (!(eventInstance instanceof BaseEvent))
        throw new Error("Event file is not extends BaseEvent\n" + eventPath);
      const eventFunc = this.warpEventFunc(eventInstance);
      this.on(eventInstance.name, eventFunc);
      this.events.set(eventInstance.name, eventInstance);
    }
  }

  private async loadCommands() {
    const commandsPattern: string = Client.generateGlobPattern("commands");

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
          "Command file is missing default export\n" + commandPath
        );
      const commandInstance: BaseCommand = new CommandClass.default(this);
      if (!(commandInstance instanceof BaseCommand))
        throw new Error(
          "Command file is not extends BaseCommand\n" + commandPath
        );
      this.commands.set(commandInstance.slashCommand.name, commandInstance);
    }
  }
}

export { Client };
