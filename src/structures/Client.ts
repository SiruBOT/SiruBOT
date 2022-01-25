import * as Discord from "discord.js";
import path from "path";
import FastGlob from "fast-glob";
import * as Sentry from "@sentry/node";
import { REST as DiscordREST } from "@discordjs/rest";
import { BaseCommand } from "./";

import {
  type APIApplicationCommand,
  type APIInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord-api-types/v9";
import type Cluster from "discord-hybrid-sharding";
import type { Logger } from "tslog";
import type { IBootStrapperArgs, ISettings } from "../types";
import type { SlashCommandBuilder } from "@discordjs/builders";
import { BaseEvent } from "./BaseEvent";

class Client extends Discord.Client {
  public cluster?: Cluster.Client;
  public settings: ISettings;
  public bootStrapperArgs: IBootStrapperArgs;
  public log: Logger;
  private restClient: DiscordREST;

  public commands: Discord.Collection<string, BaseCommand>;
  public events: Discord.Collection<string, BaseEvent>;
  // eventFunctions: Discord.Collection<
  //   string,
  //   (...args: Discord.ClientEvents[keyof Discord.ClientEvents]) => Promise<void>
  // >;

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

    this.restClient = new DiscordREST({ version: "9" });
  }

  // Setup bot database, load commands, connect lavalink nodes.. setup audio..p
  public async start(): Promise<void> {
    this.once("ready", this.setupClient); // Login -> Ready -> setupClient -> loadCommands -> ...
    this.log.info("Logging into discord...");
    try {
      await this.login(this.settings.bot.token);
      this.restClient.setToken(this.settings.bot.token);
    } catch (err) {
      Sentry.captureException(err);
      this.log.error(err);
      throw new Error("Failed to login to Discord.");
    }
  }

  private async setupClient() {
    this.log.debug("Login successful. Setup client...");
    Sentry.captureException(new Error("Discord client ready"));
    try {
      await this.loadCommands(); // TODO: 전부 핸들하고 하나라도 오류나면 process.exit(1)
      await this.loadEvents();
    } catch (err) {
      Sentry.captureException(err);
      this.log.error(err);
      throw new Error("Failed to setup client.");
    }
  }

  private generateGlobPattern(dirName: string): string {
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
    const eventsPattern: string = this.generateGlobPattern("events");
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
    const commandsPattern: string = this.generateGlobPattern("commands");

    this.log.debug("Loading commands with pattern: " + commandsPattern);
    const commands: string[] = await FastGlob(commandsPattern);
    this.log.info(`Found ${commands.length} commands`);

    // Register commands to this.commands <CommandName, BaseCommand>
    for (const commandPath of commands) {
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

    this.log.info("Checking commands to update...");
    this.log.debug(
      "Fetch global commands info from applicationCommands endpoint.."
    );
    // Get applicationCommands from discord api (Old thing)
    const resp: APIInteraction[] | unknown = await this.restClient.get(
      Routes.applicationCommands(this.application?.id as string)
    );

    if (!Array.isArray(resp))
      throw new Error(`Failed to get applicationCommands ${resp}`);

    const onlyChatInput: APIApplicationCommand[] = resp.filter(
      (e) => e.type === 1 // CHAT_INPUT = 1
    );
    /**
     * CHAT_INPUT	1	Slash commands; a text-based command that shows up when a user types "/"
     * USER	2	A UI-based command that shows up when you right click or tap on a user
     * MESSAGE	3	A UI-based command that shows up when you right click or tap on a message
     */

    // make Array<slashCommand> from this.commands
    const slashCommandArray: Omit<
      SlashCommandBuilder,
      "addSubcommand" | "addSubcommandGroup"
    >[] = [...this.commands.values()].map((e: BaseCommand) => e.slashCommand);

    const toPost: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const toPatch = new Map<string, RESTPostAPIApplicationCommandsJSONBody>();
    const toDelete: string[] = onlyChatInput
      .filter((e) => !this.commands.has(e.name))
      .map((e) => e.id);

    for (const command of slashCommandArray) {
      const jsonCommand: RESTPostAPIApplicationCommandsJSONBody =
        command.toJSON();
      const apiCommand: APIApplicationCommand = onlyChatInput.filter(
        (e) => e.name === command.name
      )[0];
      // If command is exists on api, check diffrence between api and local commands
      if (apiCommand) {
        if (command.description !== apiCommand.description) {
          toPatch.set(apiCommand.id, jsonCommand);
          continue; // Skips to next iteration
        }
        // Command.options
        if (
          JSON.stringify(jsonCommand.options) !==
          JSON.stringify(apiCommand.options ? apiCommand.options : []) // apiCommand.options possibly undefined
        ) {
          toPatch.set(apiCommand.id, jsonCommand);
          continue;
        }
        // default_permission
        if (
          jsonCommand.default_permission && // Optional property, so check if exists
          jsonCommand.default_permission !== apiCommand.default_permission
        ) {
          toPatch.set(apiCommand.id, jsonCommand);
          continue;
        }
      } else {
        toPost.push(jsonCommand);
      }
    } // End of loop

    if (toPost.length + toDelete.length + toPatch.size === 0) {
      this.log.info("All commands are up to date");
      return;
    } else {
      this.log.info("Updating commands...");
    }

    // toDelete
    if (toDelete.length > 0) {
      this.log.debug(
        `Delete ${toDelete.length} commands not in local commands`
      );
      for (const id of toDelete) {
        this.log.debug(`Deleting command ${id}`);
        await this.restClient.delete(
          Routes.applicationCommand(this.application?.id as string, id)
        );
      }
    }
    // toPost
    if (toPost.length > 0) {
      this.log.debug(`Post ${toPost.length} commands not in local commands`);
      for (const command of toPost) {
        this.log.debug(`Posting command ${command.name}`);
        await this.restClient.post(
          Routes.applicationCommands(this.application?.id as string),
          { body: command }
        );
      }
    }
    // toPatch
    if (toPatch.size > 0) {
      this.log.debug(`Patch ${toPatch.size} commands with detected changes`);
      for (const [commandId, commandJson] of toPatch.entries()) {
        this.log.debug(`Patch command ${commandJson.name}`);
        await this.restClient.patch(
          Routes.applicationCommand(this.application?.id as string, commandId),
          { body: commandJson }
        );
      }
    }
  }
}

export { Client };
