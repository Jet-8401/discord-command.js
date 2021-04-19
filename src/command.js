const Discord = require("discord.js");
const utils = require("./utils");
const fs = require("fs");
const colors = require("colors");

class Command {
	/**
	 * parse the message
	 * @param {!Discord.Message} message
	 * @param {!{prefix: string}} options
	 * @returns {[string, [string]]}
	 * you can get the return with let [command, args] = parse();
	 */
	static parse = (message, options) => {
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

	/**
	 *
	 * @param {!string|Array<string>} name
	 * @param {?string} description
	 * @param {?(message: Discord.Message, args: string[], bot: Discord.Client)=>()} executable
	 * @param {?Command|Array<Command>} childrens
	 * @param {!Documentation} documentation
	 */
	constructor(name, description, executable, childrens, documentation) {
		this.name = name;
		if (name) {
			if (typeof name === "string" || name.constructor.name === "Array")
				this.name = typeof name === "string" ? [name] : name;
			else return utils.warn("name is not a typeof string or an Array", true);
		} else return console.error("cannot read property of undefined");

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
	static config = {
		cache: {
			prefix: "",
			/**
			 * @type {Discord.Client}
			 */
			bot: new Discord.Client(),
			/**
			 * **WARNING** - only relatives paths work
			 */
			commandsPath: "",
		},
	};

	getConfig() {
		return Commands.config.cache;
	}

	/**
	 * set the global config for the commands
	 */
	setConfig(config = Commands.config.cache) {
		for (const key of Object.keys(config)) {
			if (Commands.config.cache[key] === undefined)
				utils.warn(`config.${key} does not exist`, false);
			else Commands.config.cache[key] = config[key];
		}
	}

	/**
	 * load all commands
	 */
	load() {
		return new Promise((resolve, reject) => {
			const path = Commands.config.cache.commandsPath;
			if (!path) reject(utils.warn("commands file path is incorrect.", true));

			const files = fs
				.readdirSync(path, { encoding: "utf-8" })
				.filter((value) => value.endsWith(".js"));

			console.log("Loading commands...");
			let exeption = false;
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const path = Commands.config.cache.commandsPath;
				const command = require(`.${path.endsWith("/") ? path : `${path}/`}${file}`);
				if (command.constructor.name !== "Command") {
					exeption = true;
					utils.warn(`${file} don't export a ${colors.italic("Command")} class`);
					continue;
				}
				this.set(file, command);
			}
			console.log(`All ${exeption ? "valid" : ""} commmands loaded`);
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
	onMessage(message) {
		return new Promise((resolve, reject) => {
			//- check the bot
			if (!(Discord.Client instanceof bot)) {
				utils.warn("bot is not an instance of bot!", true);
				reject();
			}

			//- check the prefix
			const prefix = Commands.config.cache.prefix;
			if (!prefix) {
				utils.warn("any prefix are set for the commands!", true);
				reject();
			}

			const [cmd, args] = Command.parse(message);

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
