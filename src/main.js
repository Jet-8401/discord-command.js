const Discord = require("discord.js");
const { Command, Commands } = require("./command");
const { token } = require("./config");
const colors = require("colors");
const bot = new Discord.Client();

Commands.load();

bot.login(token).then(() => {
	console.log(`${bot.user.username} is ${colors.blue("online")}`);
});
