import * as Discord from "discord.js";
import path from "path";
import FastGlob from "fast-glob";
import * as Sentry from "@sentry/node";
import { REST as DiscordREST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { BaseCommand } from "./";

import type Cluster from "discord-hybrid-sharding";
import type { Logger } from "tslog";
import type { IBootStrapperArgs, ISettings } from "../types";
import { InteractionRouter } from "./InteractionRouter";

class Client extends Discord.Client {
  cluster?: Cluster.Client;
  settings: ISettings;
  bootStrapperArgs: IBootStrapperArgs;
  log: Logger;
  restClient: DiscordREST;

  commands: Discord.Collection<string, BaseCommand>;

  constructor(
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
    this.restClient = new DiscordREST({ version: "9" });
  }

  // Setup bot database, load commands, connect lavalink nodes.. setup audio..p
  async start(): Promise<void> {
    this.once("ready", this.setupClient); // Login -> Ready -> setupClient -> loadCommands -> ...
    this.log.info("Logging into discord...");
    try {
      await this.login(this.settings.bot.token);
      this.restClient.setToken(this.settings.bot.token);
    } catch (err) {
      this.log.error(err);
      throw new Error("Failed to login to Discord.");
    }
  }

  async setupClient() {
    this.log.debug("Login successful. Setup client...");
    Sentry.captureException(new Error("Discord client ready"));
    await this.loadCommands(); // TODO: 전부 핸들하고 하나라도 오류나면 process.exit(1)
    await this.loadEvents();
  }

  async loadEvents() {
    // Testing purpose
    this.on("interactionCreate", async (interaction: Discord.Interaction) => {
      // this.log.debug(`Treating interaction ${interaction.id}`);
      if (interaction.isCommand()) {
        const command: BaseCommand | undefined = this.commands.get(
          interaction.commandName
        );
        if (!command) return;
        InteractionRouter.routeInteraction(interaction, command);
      }
    });
  }

  async loadCommands() {
    this.log.debug("Load commands...");
    const commandsPattern: string = path // Create pattern for command files
      .join(__dirname, "..", "..", "src", "commands", "**/*.js")
      .split("\\")
      .join("/");

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
      const commandInstance: BaseCommand = new CommandClass.default();
      if (!(commandInstance instanceof BaseCommand))
        throw new Error(
          "Command file is not extending BaseCommand\n" + commandPath
        );
      this.commands.set(commandInstance.slashCommand.name, commandInstance);
    }
    this.log.debug(`Loaded ${this.commands.size} commands`);

    this.log.debug(
      "Fetch global commands info from applicationCommands endpoint.."
    );
    // Get applicationCommands from discord api
    const resp = await this.restClient.get(
      Routes.applicationCommands(this.application?.id as string)
    );
    // make Array<slashCommand> from this.commands
    const slashCommandArray: object[] = [...this.commands.values()].map((e) =>
      e.slashCommand.toJSON()
    );
    console.log(resp);
    // Check diffrence between applicationCommands and slashCommandArray
    // if (JSON.stringify(resp) !== JSON.stringify(slashCommandArray)) {
    //   // 체크하는 부분 수정해야함
    //   this.log.debug("Updating global commands...");
    //   try {
    //     await this.restClient.put(
    //       Routes.applicationCommands(this.application?.id as string),
    //       { body: slashCommandArray }
    //     );
    //   } catch (err) {
    //     this.log.error(err);
    //     throw new Error("Failed to update global commands");
    //   }
    // } else {
    //   this.log.debug("Global commands are up to date.");
    // }
  }
}

export { Client };
