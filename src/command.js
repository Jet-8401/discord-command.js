const Discord = require("discord.js");
const utils = require("./utils");
const fs = require("fs");

/**
 * parse the message
 * @param {!Discord.Message} message
 * @param {!{prefix: string}} options
 * @returns {[string, [string]]}
 * you can get the return with let [command, args] = parse();
 */
const parse = (message, options) => {
	// check the parameter
	if (!(Discord.Message instanceof message)) {
		utils.warn("the message is not an instanceof Discord.Message.", true);
		return [null, null];
	}
	// parse the message
	const args = message.cleanContent.trim().slice(options.prefix.length).split(/ /gi);
	const cmd = args.shift();

	return [cmd, args];
};

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
		this.childrens = childrens ? (Array instanceof childrens ? childrens : [childrens]) : [];
		this.documentation = documentation;

		this.genealogicalPos = 0; // default

		this.set(this.genealogicalPos + 1);
	}

	/**
	 * a function that set the genalogical positions of all childs
	 * @param {!number} next
	 */
	set(next) {
		if (this.childrens.length > 0) {
			for (const child of this.childrens) {
				child.genealogicalPos = next;
				child.set(this.genealogicalPos + 1);
			}
		}
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
	 * @param {Discord.Client} bot
	 */
	execute(message, args, bot) {
		if (args[args.length - 1] === cmdInfo) return this.info(message, args, bot);

		if (this.childrens.length > 0) {
			for (const child of this.childrens) {
				if (child.match(args[this.genealogicalPos]))
					return child.execute(message, args, bot);
			}
			return this.executable(message, args, bot);
		}

		this.executable(message, args, bot);
	}
}

class Commands extends Discord.Collection {
	constructor() {
		super();
		this.config = {
			cache: {
				prefix: null,
				commandsPath: null,
			},
			/**
			 * set the global config for the commands
			 * @param {!{}} config
			 */
			set: function (config) {},
		};
	}

	/**
	 * load all commands
	 */
	load() {
		return new Promise((resolve, reject) => {
			const path = this.config.cache.commandsPath;
			if (!path) reject(utils.warn("commands file path is incorrect.", true));

			const files = fs
				.readdirSync(path, { encoding: "utf-8" })
				.filter((value) => value.endsWith(".js"));

			console.log("Loading commands... \n");
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				utils.log.process(`Loading ${file}... (${i + 1}/${files.length})`);
				this.set(file.name, file);
			}
			console.log("All commands loaded!");
		});
	}

	/**
	 * check if a certain command exist
	 * @param {!string} command
	 */
	exist(command) {}

	/**
	 * execute a command from a discord message
	 * @param {!Discord.Message} message
	 * @param {!Discord.Client} bot your bot client
	 */
	onMessage(message, bot) {
		return new Promise((resolve, reject) => {
			//- check the bot
			if (!(Discord.Client instanceof bot)) {
				utils.warn("bot is not an instance of bot!", true);
				reject();
			}

			//- check the prefix
			const prefix = this.config.cache.prefix ? this.prefix : options.prefix;
			if (!prefix) {
				utils.warn("any prefix are set for the commands!", true);
				reject();
			}

			const [cmd, args] = parse(message);

			// check if values are non-null
			if (!cmd || !args) reject();
			else {
				if (this.exist(cmd)) resolve(this.execute(cmd));
				else resolve(message);
			}
		});
	}
}

module["exports"] = {
	Command,
	Commands: new Commands(),
};
