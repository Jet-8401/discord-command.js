'use strict';

/**
 * Module requirements.
 */
const colors = require("colors");
const Discord = require("discord.js");

const __package = require("../package.json")
const full_package_name = __package.name + "@" + __package.version;

const InteractionType = "ApplicationComand" || "AutoComplete" || "Button" || "Command" || "ContextMenu" || "MessageComponent" || "SelectMenu";

const configuration = {};
const JsonConfig = require("../src/configuration.json");

const offsetSpace = '';

// set the configuration
Object.defineProperty(Object.getPrototypeOf(JsonConfig.prefix), "isValid", {
    get: function isValid() {
        if(typeof JsonConfig.prefix === "string") {
            if(JsonConfig.prefix.length > 0) {
                return JsonConfig.prefix;
            }
        }
    
        return false;
    }
});

/**
 * Set a key in the config. (the value must be the same type of the older one).
 * 
 * @param {string} key the key of the configuration value that you want to change
 * @param value the value has to be the same type than the last config key value
 */
configuration['set'] = function setCongif(key, value) {
    const config = this.get(key);

    if(config === value) return this;

    if(!config)
        return internalError(`the key "${key}" can't be find into the configuration file`);

    if(typeof value !== typeof config)
        return internalError(`the value must be the same as the default config value (${typeof config} instead of ${typeof value})`);

    // set the value of the key
    JsonConfig[key] = value;

    return this;
}

/**
 * Get a part of the configuration by a key.
 * 
 * @param {string} key
 * 
 * @return if the returned value is undefined thats would say
 * that this key don't exist in the config
 */
configuration['get'] = function getConfigutation(key) { 
    if(JsonConfig[key])
        return JsonConfig[key];

    return false;
};

// -- default cache -- //

function defaultCache() {}

defaultCache.prototype.set = function set(key, value) {
    this[key] = value;
    return this;
}

defaultCache.prototype.get = function get(key) {
    return this[key];
}

// -- guild cache -- //

function guildsCache() {}

/**
 * @param {string} guildId 
 * @returns 
 */
guildsCache.prototype.set = function setGuildCache(guildId) {
    this[guildId] = new defaultCache();
    return this[guildId];
}

/**
 * Get the cache of the given guild, set the cache for the guild
 * by default if it doesen't exist.
 * 
 * @param {string} guildId
 * @return {GuildCache}
 */
guildsCache.prototype.get = function getGuildCache(guildId) {
    if(!this[guildId]) {
        return this.set(guildId);
    }

    return this[guildId];
}

/**
 * Throw an internalError.
 * 
 * @param {string} message
 * @param {"aborted"|"skiped"|"continue"|"none"} actionAfter what your code doing after the error
 * 
 * @returns {Error} Return a string of the error.
 */
function internalError(message, actionAfter = "aborted") {
    const lib = {
        "aborted": colors.red,
        "skiped": colors.yellow,
        "continued": colors.green
    }

    const error = new Error(`${full_package_name} --> ${message}${actionAfter !== "none" ? `\n  - ${"action " + actionAfter}` : ""}`);
    const errorColorised = new Error(`${message}${actionAfter !== "none" ? `\n  - ${lib[actionAfter]("action " + actionAfter)}` : ""}`).stack;

    console.error(`${offsetSpace}${colors.magenta(`(${full_package_name})`)} ${errorColorised}`);

    return error;
}

/**
 * Send a message in the console with the specification
 * that it come from the package.
 * 
 * @param {string} message 
 */
function internalConsole(message) {
    console.log(`${offsetSpace}${colors.blue(`(${full_package_name})`)} ${message}`);
}

/**
 * Display a warning in the console.
 * 
 * @param {string} message 
 * @returns {string}
 */
 function internalWarn(message) {
    const WARNING = `${colors.red(`(${full_package_name})`)} ${message}`;
    console.error(WARNING);
    return WARNING;
}

function debug(message) {
    console.log(`${colors.bgGreen(`(${full_package_name})`)} ${message}`);
}

// const log = {
// 	/**
// 	 * overwrite a message in the console
// 	 * @param {!string} message
// 	 */
// 	process: function (message) {
// 		process.stdout.cursorTo(0);
// 		process.stdout.clearLine();
// 		process.stdout.write(message);
// 	},
// };

/**
 * Upper case the first char of a string.
 * 
 * @param {!string} string
 */
function capitalize(string) {
	if (typeof string !== "string") return string;
	const upper = string.toUpperCase();
	return upper[0] + string.slice(1);
};

/**
* Parse a `Discord.Message` or an instance of.
* 
* @param {Discord.Message} message
*/
function parse(message) {
    if(!message instanceof Discord.Message)
        return internalError("message parameter must be an instance of Discord.Message");

    const prefix = configuration.get("prefix").isValid;
    let content = message.cleanContent.slice(prefix.length);
  
    const args = content.split(/ +/ig);

    return {
        "command": args.shift(),
        "content": content,
        "arguments": args,
    }
}

/**
 * Check if the given object can match with the command constructor.
 * 
 * @param {commandObj}
 */
 function isCommandObj(obj) {
	// check if the entries and executable exist
	if(!(obj['entries'] && obj['executable'])) return false;

	// check if the entries is an array or a string
	if(!(Array.isArray(obj['entries']) || typeof obj['entries'] === "string")) return false;

	// check if the executable is a function
	if(typeof obj['executable'] !== "function") return false;

	return true;
}

module["exports"] = {
    InteractionType,
    configuration,
    defaultCache,
    guildsCache,
	internalError,
    internalConsole,
    internalWarn,
    debug,
    parse,
	capitalize,
    isCommandObj
};
