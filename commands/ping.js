const { Command } = require("../src/command");

module["exports"] = new Command("ping", null, (message, args, bot) => {
	message.channel.send("pong !");
});
