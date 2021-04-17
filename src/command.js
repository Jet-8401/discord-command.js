const Discord = require("discord.js");
const { cmdInfo, prefix } = require("./config.js");

class Command {
	/**
	 *
	 * @param {!string|Array<string>} name
	 * @param {?string} description
	 * @param {?function} executable
	 * @param {?Command|Array<Command>} childrens
	 * @param {!Documentation} documentation
	 */
	constructor(name, description, executable, childrens, documentation) {
		this.name = Array instanceof name ? name : [name];
		this.description = description;
		this.executable = executable;
		this.childrens = Array instanceof childrens ? childrens : [childrens];
		this.documentation = documentation;

		this.genealogicalPos = 0; // default
	}

	/**
	 * check if a string match with this command
	 * @param {!string|Array<string>} string
	 */
	match(string) {
		for (const name of this.name) {
			if (name === string) return true;
		}
		return false;
	}

	/**
	 * execute the command
	 * @param {Discord.Message} message
	 * @param {Array<string>} args
	 * @param {Discord.CLient} bot
	 */
	execute(message, args, bot) {
		if (args[args.length - 1] === cmdInfo) return this.info(message, args, bot);

		// check the arguments

		this.executable(message, args, bot);
	}
}
