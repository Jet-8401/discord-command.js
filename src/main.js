const Discord = require("discord.js");
const { Commands } = require("./command");
const { token } = require("./config");
const colors = require("colors");
const bot = new Discord.Client();

Commands.setConfig({ prefix: "-", commandsPath: "./commands", bot });
Commands.load();

bot.on("message", Commands.onMessage);

bot.login(token).then(() => {
	console.log(`${bot.user.username} is ${colors.blue("online")}`);
});
