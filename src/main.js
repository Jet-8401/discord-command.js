const Discord = require("discord.js"),
	command = require("./command"),
	{ token, prefix } = require("./config.json"),
	bot = new Discord.Client();

bot.on("message", command.onMessage);

bot.login(token);
