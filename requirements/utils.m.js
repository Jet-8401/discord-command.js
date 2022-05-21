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

const cache = require("../src/configuration.json");

// set the configuration
Object.defineProperty(Object.getPrototypeOf(cache.prefix), "isValid", {
    get: function isValid() {
        if(this.prefix instanceof String)
            if(this.prefix.length > 0)
                return true;
    
        return '-';
    }
});

/**
 * Set a key in the config. (the value must be the same type of the older one).
 * 
 * @param {string} key the key of the configuration value that you want to change
 * @param value the value has to be the same type than the last config key value
 * @param {boolean} save if the value is save into the file (can cause issue if the code is powered by the nodemon package)
 */
configuration['set'] = function setCongif(key, value, save) {
    const config = this.get(key);

    if(config === value) return this;

    if(!config)
        return internalError(`the key "${key}" can't be find into the configuration file`);

    if(typeof value !== typeof config)
        return internalError(`the value must be the same as the default config value (${typeof config} instead of ${typeof value})`);

    // set the value of the key
    cache[key] = value;

    if(save) {
        fs.writeFile(__dirname + "\\configuration.json", Buffer.from(JSON.stringify(cache), "utf8"), {encoding: "utf8"}, err => {
            if(err) throw err;
        });
    }

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
configuration['get'] = function getConfig(key) {
    if(cache[key])
        return cache[key];
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

    console.error(
        new Error(
            `${colors.magenta(full_package_name)} --> ${message}${actionAfter !== "none" ? `\n  - ${lib[actionAfter]("action " + actionAfter)}` : ""}`
        )
    );

    return error;
}

/**
 * Display a warning in the console.
 * 
 * @param {string} message 
 * @returns {string}
 */
 function warn(message) {
    const ERROR = new Error(message);
    const WARNING = `Warn: ${colors.bgMagenta(full_package_name)} --> ${ERROR.stack.slice(ERROR.stack.indexOf(ERROR.message))}`;
    console.error(WARNING);
    return WARNING;
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

module["exports"] = {
    InteractionType,
    configuration,
    parse,
	internalError,
    warn,
	capitalize
};
