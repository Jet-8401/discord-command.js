'use strict';

/**
 * Module requirements.
 */
const Discord = require("discord.js");
const { internalError, parse, isCommandObj } = require("../requirements/utils.m.js");

/**
 * Model of commandFunction.
 * 
 * @param {Object} param
 * @param {Discord.TextBasedChannels} param.channel the channel where the command has been invoked
 * @param {Discord.Message} param.message the message that trigered the command
 * @param {string} param.content the content of the message (without the command)
 * @param {Array<string>} param.args the arguments of the command
 * @param {Discord.Interaction} param.interaction if the command was invoked by an interaction
 * @param {Discord.Interaction|Discord.Message} param.resolvable
 */
const commandFunction = function({channel, message, interaction, content, args, resolvable}){};

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
	this.description = options === undefined ? null : options.description;

	/**
	 * @type {Array<string>}
	 */
	this.categories = options === undefined ? [] : 
		Array.isArray(options.categories) ? options.categories : 
			typeof options.categories === "string" ? [options.categories] : [];

	/**
	 * Childrens command that are relied to this command.
	 * 
	 * @type {Array<command>}
	 */
	this.childrens = [];

	/**
	 * The type of interactions that can execute this command.
	 */
	this.interactionsTypes = options === undefined ? [] : 
		Array.isArray(options.interactionsTypes) ? options.interactionsTypes : [options.interactionsTypes];

	/**
	 * If the command can be executed only by interactions.
	 */
	this.interactionsOnly = options === undefined ? false : options.interactionsOnly;

	/**
	 * The genealogical position of the current command.
	 */
	this.genealogicalPos = -1;

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
	const __arguments = {channel, content, args, interaction, message, resolvable};

	if(args.length === 0 || this.childrens.length === 0)
		// execute the command
		return this.executable(__arguments);

	for(let i = 0; i < this.childrens.length; i++) {
		// if the arguments at the same position than the *genealogicalPosition match
		// execute the command chain for it
		const match = this.childrens[i].match(args[this.genealogicalPos]);
		if(match) return this.childrens[i].execute(resolvable, content, args);
	}

	// if any child arguments is
	// valid just execute the command
	return this.executable(__arguments);
}

/**
 * Check if the specified entry match with the entries of the command.
 * 
 * @param {string|Array<string>} entry
 * @param {Object} options
 * @param {boolean} options.strict
 * @returns {boolean|string}
 */
command.prototype.match = function match(entry, options) {
	if(!entry) return internalError("entry can't be undefined");

	const strict = options ? (options.strict ?? false) : false;

	if(entry instanceof Array) {
		if(strict) return this.entries === entry;
		
		let matches = [];
		// push every entry that matches with the entries of the command
		for(var i = 0; i < entry.length; i++) {
			for(let j = 0; j < this.entries.length; j++) {
				if(this.entries[j] === entry[i]) matches.push(entry[i]);
			}
		}
		if(i === matches.length) return true; // if all entry matches send a boolean
		return matches;
	}

	if(typeof entry === "string") {
		for(let i = 0; i < this.entries.length; i++) {
			if(this.entries[i] === entry) return true;
		}
		return false;
	}

	return internalError("entry must be an instance of string or an array");

	// function compareWith(string) {
	// 	for(let i = 0; i < this.entries.length; i++) {
	// 		if(string === this.entries[i]) return true;
	// 	}

	// 	return false;
	// }

	// function compareArray(array) {
	// 	let trueComparisons = 0;

	// 	for(let i = 0; i < array.length; i++) {
	// 		if(compareWith(array[i])) {
	// 			if(!strict) return true;
	// 			trueComparisons += 1;
	// 		}
	// 	}

	// 	return trueComparisons === array.length;
	// }

	// if(typeof entry === "string")
	// 	return compareWith(entry)

	// if(entry instanceof command)
	// 	return compareArray(entry.entries);

	// if(entry instanceof Array)
	// 	return compareArray(entry);

	// return false;
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

const commandObj = {
	/**
	 * @type {Array<string>}
	 */
	"entries": [],
	"executable": commandFunction
}

function init() {
	this.genealogicalPos += 1;
	for(const child of this.childrens)
		child.genealogicalPos = this.genealogicalPos + 1;
}

module['exports'] = command;
