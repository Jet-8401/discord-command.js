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
		if (!(message instanceof Discord.Message)) {
			utils.warn("the message is not an instanceof Discord.Message.", true, true);
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
	 * @param documentation
	 */
	constructor(name, description, executable, childrens) {
		this.name = name;
		if (name) {
			if (typeof name === "string" || name.constructor.name === "Array")
				this.name = typeof name === "string" ? [name] : name;
			else return utils.warn("name is not a typeof string or an Array", true, true);
		} else return console.error("cannot read property of undefined");

		for (let i = 0; i < this.name.length; i++) this.name[i].trim();

		this.description = description;
		this.executable = executable;
		this.childrens = childrens ? (childrens instanceof Array ? childrens : [childrens]) : [];

		this.genealogicalPos = 0; // default
		this.parent = undefined; // default

		this.set(this.genealogicalPos + 1);
	}

	/**
	 * @param {!number} next
	 */
	set(next) {
		if (this.childrens.length > 0) {
			for (const child of this.childrens) {
				child.genealogicalPos = next;
				child.parent = this;
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
	 * return the info of a command in a discord embed
	 * @param {!Discord.Message} message
	 * @param {string} command
	 */
	info(message, command) {
		const embed = new Discord.MessageEmbed()
			.setColor(Commands.cache.config.color || "#1f6fea")
			.setTitle(`Info of ${this.name[0]}`)
			.setDescription(
				utils.capitalize(this.description) || "This command dont have any description."
			);

		if (this.name.length > 1)
			embed.addField(
				"Other appellations",
				this.name.filter((value) => value !== command),
				true
			);
		if (this.childrens.length > 1)
			embed.addField(
				"Options",
				(() => {
					const total = new Array(0);
					for (const child of this.childrens) total.push(child.name[0]);
					return total;
				})(),
				true
			);

		message.channel.send(embed);
	}

	/**
	 * execute the command
	 * @param {Discord.Message} message
	 * @param {Array<string>} args
	 * @param {Discord.Client} bot
	 * @param {string} command
	 */
	execute(message, args, bot, command) {
		if (this.childrens.length > 0) {
			for (const child of this.childrens) {
				if (child.match(args[this.genealogicalPos]))
					return child.execute(message, args, bot);
			}
		}

		if (Commands.cache.config.extraHelps) {
			if (args[args.length - 1] === Commands.cache.config.info)
				return this.info(message, command);
		}

		if (this.executable instanceof Function) this.executable(message, args, bot);
		else message.reply("This command need some options.");
	}
}

class Commands {
	static cache = {
		config: {
			prefix: "",
			/**
			 * **WARNING** - only relatives paths work
			 */
			commandsPath: "",
			extraHelps: true,
			info: "--info",
			documentation: "--help",
		},
		commands: new Discord.Collection(),
	};

	getConfig() {
		return Object.assign({}, Commands.cache.config);
	}

	/**
	 * set the global config for the commands
	 */
	setConfig(config = Commands.cache.config) {
		for (const key of Object.keys(config)) {
			if (Commands.cache.config[key] === undefined)
				utils.warn(`config.${key} does not exist`, false, true);
			else Commands.cache.config[key] = config[key].trim();
		}
	}

	/**
	 * load all commands
	 */
	load() {
		return new Promise((resolve, reject) => {
			let path = Commands.cache.config.commandsPath;
			if (!path || path === "") {
				utils.warn(
					`comand file path is incorect in config ${colors.italic(`(${path})`)}`,
					true
				);
				reject();
			}

			// parse the path
			for (const regex of ["./", "/"])
				if (path.startsWith(regex)) path = path.slice(regex.length);

			if (path.endsWith("/")) path = path.slice(0, path.length - 1);

			const files = fs.readdirSync(`../../${path}`).filter((value) => value.endsWith(".js"));
			for (const file of files) {
				const command = require(`../../../${path}/${file}`);

				if (!(command instanceof Command)) {
					utils.warn(`${file} is not a command`);
					reject();
				}

				Commands.cache.commands.set(command.name, command);
			}
			resolve();
		});
	}

	/**
	 * check if a certain command exist
	 * @param {!string} command
	 * @returns {Command|false}
	 */
	exist(command) {
		for (const keys of Commands.cache.commands.keys()) {
			for (const key of keys) {
				if (command === key) return Commands.cache.commands.get(keys);
			}
		}
		return false;
	}

	/**
	 * execute a command from a discord message
	 * @param {!Discord.Message} message
	 */
	onMessage(message, bot) {
		const cache = Commands.cache;

		if (message.author.bot || !message.content.startsWith(cache.config.prefix)) return;

		// check if commands are loaded
		if (cache.commands.array().length === 0) {
			utils.warn(
				"no commands has been loaded, maybe you forgot to load them or you dont added some :/",
				true
			);
			return;
		}

		//- check the prefix
		const prefix = cache.config.prefix;
		if (!prefix || prefix === "") {
			utils.warn("any prefix are set for the commands in the config!", true);
			return;
		}

		const [cmd, args] = Command.parse(message, { prefix: cache.config.prefix });

		// check if values are non-null
		if (!cmd || !args) return;
		else {
			const command = this.exist(cmd);
			if (command) command.execute(message, args, bot, cmd);
			else return message;
		}
	}

	add(command) {
		if (!command instanceof Command) {
			utils.warn("command is not an instance of Command", true, true);
			return;
		}

		Commands.cache.commands.set(command.name, command);
	}
}

module["exports"] = CommandManager = {
	Command,
	Commands: new Commands(),
};
