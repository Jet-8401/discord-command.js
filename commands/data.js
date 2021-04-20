const { Command } = require("../src/command");

const store = new Command("store", null, (message, args, bot) => {
	message.reply(`${args} stored`);
});

const show = new Command(["show", "shw"], null, (message, args, bot) => {
	message.reply(bot.user.username);
});

module["exports"] = new Command(["data", "dt"], null, null, [store, show]);
