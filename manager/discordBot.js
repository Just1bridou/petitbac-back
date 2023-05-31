const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { getPartiesCount, getUsersCount } = require("../server");

let client = null;

module.exports = {
  init,
  sendLogMessage,
  sendErrorMessage,
};

async function apiCommands() {
  const commands = [
    {
      name: "parties",
      description: "Get the parties count",
    },
    {
      name: "users",
      description: "Get the users count",
    },
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

async function sendLogMessage(message) {
  if (!client) return;
  const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
  if (!channel) return;
  await channel.send(message);
}

async function sendErrorMessage(message) {
  if (!client) return;
  const channel = await client.channels.fetch(process.env.ERROR_CHANNEL_ID);
  if (!channel) return;
  await channel.send(message);
}

async function init() {
  await apiCommands();
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("ready", () => {
    console.log("Discord bot ready!");
    sendLogMessage(
      `***################ DISCORD BOT READY at ${new Date().toLocaleDateString(
        "FR-fr"
      )} ${new Date().toLocaleTimeString("FR-fr")} ################***`
    );
    sendErrorMessage(
      `***################ DISCORD BOT READY at ${new Date().toLocaleDateString(
        "FR-fr"
      )} ${new Date().toLocaleTimeString("FR-fr")} ################***`
    );
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "parties") {
      let count = getPartiesCount();
      await interaction.reply(`${count} parties.`);
    }

    if (interaction.commandName === "users") {
      let count = getUsersCount();
      await interaction.reply(`${count} users.`);
    }
  });

  client.login(process.env.TOKEN);
}
