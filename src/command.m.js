'use strict';

/**
 * Module requirements.
 */
const Discord = require("discord.js");
const { defaultCache, guildsCache } = require("../requirements/utils.m.js");
const { internalError, parse, isCommandObj, configuration } = require("../requirements/utils.m.js");

/**
 * Model of commandFunction.
 * 
 * @param {Object} param
 * @param {Discord.TextBasedChannels} param.channel the channel where the command has been invoked
 * @param {Discord.Message} param.message the message that triggered the command
 * @param {string} param.content the content of the message (without the command)
 * @param {Array<string>} param.args the arguments of the command
 * @param {Discord.Interaction} param.interaction if the command was invoked by an interaction
 * @param {Discord.Interaction|Discord.Message} param.resolvable
 * @param {Discord.Client} param.bot the client of the bot
 * @param {command} param.command
 */
const commandFunction = function({channel, message, interaction, content, args, resolvable, bot, command}){};

/**
 * This function will allow you to create a command.
 * 
 * - You can use this command like an interaction as well if you give
 * what interaction will execute this command in `options.InteractionUse`.
 * 
 * - And if you want to create a command that only gonna be executed by interactions
 * you can specify the `options.onlyInteraction`.
 * 
 * @param {string|Array<string>} entries the name/names of the command
 * @param {commandFunction} executable the function that the command gonna execute
 * @param {Object} options
 * @param {?string} options.description
 * @param {?string|Array<string>} options.categories
 * @param {?Array<command>} options.childrens
 * @param {?Array<Discord.InteractionType>} options.interactionsTypes All types of interaction that can execute this command
 * @param {?boolean} options.interactionsOnly if the command can be executed only by interactions
 * @param {?number} options.timeout the waiting time (in ms) for executing an other time this command
 * @param {?commandFunction} options.onTimeout the function that gonna be executed if the command been timedout
 * @param {?boolean} options.universalTimeout if the timeout applied through any discord guilds/servers
 */
function command(entries, executable, options) {
	if(typeof entries !== "string")
		if(!entries instanceof Array)
			return internalError("entries must be a string or a Array<string>");

	if(typeof executable !== "function")
		return internalError("executable must be a type of function");

	/**
	 * All of entries/names/keys avaible for access to this command.
	 * 
	 * @type {Array<string>}
	 */
	this.entries = typeof entries === "string" ? [entries] : entries;

	/**
	 * The executable function of the command.
	 * 
	 * @type {commandFunction}
	 */
	this.executable = executable;

	/**
	 * @type {string|undefined}
	 */
	this.description = !options ? undefined : options.description;

	/**
	 * @type {Array<string>}
	 */
	this.categories = !options ? [] : 
		Array.isArray(options.categories) ? options.categories : 
			typeof options.categories === "string" ? [options.categories] : [];

	/**
	 * @type {Array<command>}
	 */
	this.childrens = [];

	/**
	 * The type of interactions that can execute this command.
	 */
	this.interactionsTypes = !options ? [] : 
		Array.isArray(options.interactionsTypes) ? options.interactionsTypes : [];

	/**
	 * If the command can be executed only by interactions.
	 * @type {boolean}
	 */
	this.interactionsOnly = !options ? false : options.interactionsOnly;

	/**
	 * The timeout between each execution of this command.
	 * @type {number}
	 */
	this.timeout = options ? options.timeout : 0;

	/**
	 * The function that gonna be executed if the command been timedout
	 * @type {Function|false}
	 */
	this.onTimeout = options ? options.onTimeout : false;


	/**
	 * If the timeout is the same for every guilds.
	 * @type {boolean}
	 */
	this.universalTimeout = !options ? false : options.universalTimeout;

	this.genealogicalPos = -1;

	this.cache = new defaultCache();

	if(!this.universalTimeout) this.cache.set('guilds', new guildsCache());

	// if the default timeout for the commands
	// exist and that the current command don't have
	// one, attribute it the default
	if(handler.cache.get('timeout_by_default')) {
		if(!this.timeout) this.timeout = handler.cache.get('default_timeout');
	}

	// same for the timeout but with the function
	// that is executed when the command is timed out
	if(handler.cache.get('default_ontimeout')) {
		if(!this.onTimeout) this.onTimeout = handler.cache.get('default_ontimeout');
	}

	// check if all values in options.childrens are an instance of command
	if(options) {
		if(options.childrens) {
			for(let i = 0; i < options.childrens.length; i++) {

				// if the child is an instance of a command
				if(options.childrens[i] instanceof command) {
					// add it
					this.childrens.push(options.childrens[i]);
					continue;
				}

				// if the child is an object that can be resolved by command
				if(isCommandObj(options.childrens[i])) {
					// add it
					this.childrens.push(
						new command(
							options.childrens[i]['entries'],
							options.childrens[i]['executable'],
							options.childrens[i]['options']
						)
					);
					continue;
				}

				// but if `child` don't fit just throw an error
				internalError(`options.childrens[${i}] can't be resolved.`, "skiped");

			}
		}
	}

	// init the command
	init.apply(this);

	return this;
}

/**
 * Execute the command chain.
 * 
 * @param {Discord.Message|Discord.Interaction} resolvable
 * @returns 
 */
command.prototype.execute = function commandExexcution(resolvable) {
	// argument type check
	if(!(resolvable instanceof Discord.Message) && !(resolvable instanceof Discord.Interaction))
		return internalError("resolvable is not a type of Discord.Message or Discord.Interaction");

	// set the variables based on the type of the resolvable
	var channel = resolvable.channel,
	              args = [],
				  content,
				  interaction,
				  message;

	if(resolvable instanceof Discord.Message) {
		const parsedMessage = parse(resolvable);
		content = parsedMessage["content"];
		args = parsedMessage["arguments"];
		message = resolvable;
	}

	if(resolvable instanceof Discord.Interaction) {
		interaction = resolvable;
	}

	// set the variable for pass arguments trough destructuration
	const __arguments = {
		channel,
		content,
		args,
		interaction,
		message,
		resolvable,
		bot: handler.cache.get('client'),
		command: this
	};

	// if there at least one arguments
	// check the statics commands and the childrens
	if(args.length > 0) {
		const nextArg = args[this.genealogicalPos];
		const staticCommandsPrefix = configuration.get("static_commands_prefix");

		if(handler.staticCommands.enabled && handler.staticCommands.count > 0) {
			if(nextArg.startsWith( staticCommandsPrefix )) {
				// if the static commands can be called by this command execute it
				const staticCommand = handler.staticCommands.checkWith(this, nextArg.slice(
					handler.configuration.get("static_commands_prefix").length
				));
				if(staticCommand) return staticCommand.executable(__arguments);
			}
		}

		for(let i = 0; i < this.childrens.length; i++) {
			// if the arguments is at the same position than the *genealogicalPosition match
			// execute the command chain for it
			const match = this.childrens[i].match(nextArg);
			if(match) return this.childrens[i].execute(resolvable);
		}
	}

	// if zero arguments was given or statics commands/childrens was not detected
	// check if there is a timeout
	if(this.timeout > 0) {

		// get the cache by depend if we have to set it by guilds or by default
		// (the cache is the same instance in both choices)
		const cache = this.universalTimeout ? this.cache : this.cache.guilds.get(__arguments.channel.guildId);

		// check the lastExecution time
		const lastExecution = cache.get('lastExecution');

		// if the last execution dosen't exist mean that the command never been executed
		// so don't need to check the timeout
		// else for cheking the timeout we taking the current timestamp that will always be upper or the same
		// than the last timestamp so no negative number
		if(!lastExecution || (Date.now() - lastExecution) > this.timeout) {
			// set the cache and pass to the next part of the function (execute the command)
			cache.set('lastExecution', Date.now());
		}
		// else execute the command when a command get a timed out
		else {
			// if the function exist execute it
			if(this.onTimeout) this.onTimeout(__arguments);

			return;
		}

	}

	// execute the command
	this.executable(__arguments);
}

/**
 * Check if the specified entry match with the entries of the command.
 * 
 * @param {string|Array<string>} entry
 * @param {Object} options
 * @param {boolean} options.strict
 * @returns {boolean|Array<string>}
 */
command.prototype.match = function match(entry, options) {
	if(!entry) return internalError("entry can't be undefined");

	const strict = options ? (options.strict ?? false) : false;

	if(entry instanceof Array) {		
		let matches = [];
		// push every entry that matches with the entries of the command
		for(var i = 0; i < entry.length; i++) {
			for(let j = 0; j < this.entries.length; j++) {
				if(this.entries[j] === entry[i]) matches.push(entry[i]);
			}
		}
		if(strict) if(matches.length === i) return true;
		if(matches.length > 0) return true;
		return false;
	}

	if(typeof entry === "string") {
		for(let i = 0; i < this.entries.length; i++) {
			if(this.entries[i] === entry) return true;
		}
		return false;
	}

	internalError("entry must be an instance of string or an array");
}

/**
 * Set the given categories to the command.
 * 
 * @param {Array<string>} categories
 * @param {Object} options
 * @param {boolean} options.recursive
 */
command.prototype.setCategory = function setCategory(categories, options) {
	if(!Array.isArray(categories))
		return internalError('The categories need to be an Array of String');

	this.categories = this.categories.concat(categories);

	// if the recursive options is enable
	// set the category for all of the childs
	if(options.recursive) {
		for(const child of this.childrens) {
			child.setCategory(categories, options);
		}
	}

	return this;
}

/**
 * Add a child to the command.
 * 
 * @param {command} children 
 * @param {object} options
 * @param {?boolean} options.setCategories if the category is automatically defined on the child
 */
command.prototype.addChild = function addChildren(children, options) {
	if(!(children instanceof command)) {
		return internalError('children must be an instance of command.');
	}

	// check the possibles options
	if(options) {
		if(options.setCategories) children.setCategory(this.categories, options);
	}

	children.genealogicalPos = (this.genealogicalPos + 1);
	init.apply(children);

	this.childrens.push(children);

	return this;
}

/**
 * Add an array of childrens.
 * 
 * @param {Array<command>} childrens 
 * @param {object} options
 * @param {?boolean} options.setCategories if the category is automatically defined on the child
 * @returns 
 */
command.prototype.addChilds = function addChildrends(childrens, options) {
	for(const child of childrens) this.addChild(child, options);

	return this;
}

function init() {
	this.genealogicalPos += 1;
	for(const child of this.childrens)
		child.genealogicalPos = this.genealogicalPos + 1;
}

module['exports'] = command;
