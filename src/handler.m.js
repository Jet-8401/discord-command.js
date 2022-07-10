'use strict';

/**
 * Module requirements.
 */
const fs = require("fs");
const Discord = require("discord.js");
const {
    configuration,
    defaultCache,
    parse,
    internalError,
    internalConsole,
    internalWarn,
    isCommandObj,
    guildsCache
} = require("../requirements/utils.m.js");

/**
 * Tell if all commands are loaded.
 */
let commandLOADED = false;

const handler = {};

handler['command'] = require("./command.m.js");
handler['staticCommands'] = require("./staticCommands.m.js");
handler['configuration'] = configuration;
handler['autorised'] = require("../requirements/autorised.m.js");
handler['parse'] = parse;
handler['cache'] = new defaultCache();
handler['guildsCache'] = new guildsCache();

// Extra handler for voice connections
handler['voice'] = require("./voice-handler.m.js");

/**
 * Dictionary of all commands.
 * 
 * @type {Array<handler.command>}
 */
handler['commands'] = [];

// define a getter to know if the commands was loaded
Object.defineProperty(handler.commands, "loaded", {get: function() {
    return commandLOADED;
}});

/**
 * @param {string} name name of the file or the directory
 * @param {string} path path of the current element
 * @param {boolean} isDirectory 
 */
function filterRegister(name, path, isDirectory) {};

/**
 * Register a command to the handler.
 * 
 * @param {string|handler.command} resolvable a folder path to a directory of commands using `file://` protocol or a command
 * @param {Object} options
 * @param {?boolean} options.auto_categorise
 * @param {?boolean} options.recursive
 * @param {?filterRegister} options.filter
 * @returns 
 */
handler['register'] = function commandRegister(resolvable, options) {
    if(!resolvable)
        return internalError("resolvable argument must be provided");

    if(typeof resolvable === "string") {

        // if the path is relative set it from the root
        const fullPATH = resolvable.startsWith(__dirname) ? resolvable : fs.realpathSync(__dirname + "../../../../" + resolvable);

        if(!fs.existsSync(fullPATH))
            return internalError(`the given path don't exist ${fullPATH}`);
    
        commandLOADED = true;
    
        if(isDirectory(fullPATH))
            return loadDirectory.apply(this, [fullPATH, options]);
    
        return loadFile.apply(this, [fullPATH]);

    } else if(resolvable instanceof this.command) {

        addCommand.apply(this, [resolvable]);

    }
}

/**
 * Resolve a Discord.Message or a Discord.Interaction.
 * 
 * @param {Discord.Message|Discord.Interaction} resolvable an instance of a `Discord.Message` | `Discord.Interaction`
 */
handler['resolve'] = function resolve(resolvable) {
    // check the type of the resolvable
    if(resolvable instanceof Discord.Message) {
        return this.executeMessage(resolvable);
    }

    // if its an interaction resolve it into the handler
    if(resolvable instanceof Discord.Interaction)
        return this.executeInteraction(resolvable);
}

/**
 * Execute a specified command by the base of an interaction.
 * 
 * @param {Discord.Interaction} interaction
 */
handler['executeInteraction'] = function executeInteraction(interaction) {
    // check if devMod is enable
    if(!this.autorised.check(interaction.member)) return;

    if(!(interaction instanceof Discord.Interaction))
        return internalError("interaction parameter must be an instance of Discord.Interaction");

    let key = "";

    switch (interaction.type) {
        case "APPLICATION_COMMAND_AUTOCOMPLETE":
        case "APPLICATION_COMMAND":
            key = interaction.commandName;
            break;

        case "MESSAGE_COMPONENT":
            key = interaction.component.customId;
            break;

        default:
            break;
    }

    const command = this.hasCommand(key);
    if(command) command.execute(interaction);

    return this;
}

/**
 * Execute the specified command by the base of a message.
 * 
 * @param {Discord.Message} message an instance of a `Discord.Message`
 */
handler['executeMessage'] = function executeMessage(message) {
    // check if devMod is enable
    if(!this.autorised.check(message.member)) return;

    if(!message instanceof Discord.Message)
        return internalError("message parameter must be an instance of Discord.Message");

    // block the execution if the prefix isn't right
    if(!message.cleanContent.startsWith(this.configuration.get("prefix").isValid))
        return;

    // block the execution if the message provided come from a bot
    // and the option is enable
    if(this.configuration.get("block_bot_messages") && message.author.bot)
        return;

    // parse the message and get the name of the comand to execute
    const cmd_name = this.parse(message)["command"];

    // check if the command requested exist
    const command = this.hasCommand(cmd_name, {filter: (value) => !value.interactionsOnly});
    if(command) {
        return command.execute(message);
    }

    return this;
}

/**
 * Check if the handler has a specific command.
 * 
 * Explanation of what this function will return you based on the command argument given :
 * - String --> handler.command | null
 * - String[] --> handler.command[] | null
 * - String[][] --> handler.command[] | null
 * 
 * Options: 
 * - strict - (only if the command parameter is an instance of array)
 * will return you if all of the command in the array was found, if one is missing it will return `false`
 * 
 * @param {string|Array<string>|Array<Array<string>>} command 
 * @param {Object} options 
 * @param {?boolean} options.strict 
 * @param {?boolean} options.strictEntries
 * @param {(value, index: number, array: Array<any>)} options.filter a function work like as the `Array<any>.filter((value, index, array) => {})`
 *                                                                   (only if the command argument is a type of srtring)
 * @returns {false|handler.command|Array<handler.command>}
 */
handler['hasCommand'] = function hasCommand(command, options = {strict: false, strictEntries: false, filter: null}) {
    if(!this.commands.loaded) {
        internalError("no commands has been loaded (empty handler)", "continue");
        return false;
    }

    const {strict, strictEntries, filter} = options;

    // at refactorise...

    if(Array.isArray(command)) {
        const found = [];
        for(let i = 0; i < this.commands.length; i++) {
            // if the command don't match with the filter skip the rest of the loop
            if(filter) if(!filter(this.commands[i], i, this.commands)) continue;
            for(let j = 0; j < command.length; j++) {
                // check with strict entries
                if(strictEntries) {
                    if(this.commands[i]["entries"].toString() === command[j].toString()) {
                        found.push(this.commands[i]);
                        j = command.length;
                    }
                } else {
                    // check each entries with each posibility of command
                    for(let h = 0; h < this.commands[i]["entries"].length; h++) {
                        // if the command paramter is a 2D array
                        if(Array.isArray(command[i])) {
                            for(let g = 0; g < command[j].length; g++) {
                                if(this.commands[i]["entries"][h] === command[j][g]) {
                                    found.push(this.commands[i]);
                                    // if the command is found just skip it for others verifications
                                    h = this.commands[i]["entries"].length
                                }
                            }
                        }

                        if(this.commands[i]["entries"][h] === command[j]) {
                            found.push(this.commands[i]);
                            h = this.commands[i]["entries"].length;
                        }
                    }
                }
            }
        }
        if((strict && found.length < command.length) || found.length === 0) return false;
        return found;
    }

    if(typeof command === "string") {
        for(let i = 0; i < this.commands.length; i++) {
            for(let j = 0; j < this.commands[i]['entries'].length; j++) {
                if(filter) if(!filter(this.commands[i], i, this.commands)) continue;
                if(this.commands[i]['entries'][j] === command) return this.commands[i];
            }
        }
        return false;
    }

    return internalError("command must be a typeof String or Array");
}

/**
 * Unlaod a command that was previously register.
 * Can use `*` to unload all the commands.
 * 
 * @param {string|handler.command} command 
 */
handler['unload'] = function unloadCommand(command) {
    function _unload_(i, n) {
        internalConsole(`${command} is unload!`);
        this.commands.splice(i, n);
        return true;
    }

    if(command === '*') {
        commandLOADED = false;
        return _unload_.apply(this, [0, this.commands.length]);
    }

    for(let i = 0; i <  this.commands.length; i++) {
        for(const entry of this.commands[i]['entries']) {

            if(typeof entry === "string") {
                if(entry === command) return _unload_.apply(this, [i, 1]);
            }

            if(entry instanceof this.command) {
                if(entry.match(command.entries)) return _unload_.apply(this, [i, 1]);
            }

        }
    }

    return false;
}

function isDirectory(path) {
    return fs.statSync(path).isDirectory();
}

function loadDirectory(path, options = {}) {
    const directories = {};

    // loop through the given directory
    // (load the files first)
    for(const currentElement of fs.readdirSync(path)) {
        const resolvedPath = fs.realpathSync(path + "\\" + currentElement);
        const isResolvedPathIsDirectory = isDirectory(resolvedPath);

        // check for files or folder to exclude
        if(options) {
            if(options.filter) if(options.filter(
                /* name */        currentElement,
                /* path */        resolvedPath,
                /* isDirectory */ isResolvedPathIsDirectory
            )) continue;
        }

        // if its a directory skip him for now
        if(isResolvedPathIsDirectory) {
            directories[resolvedPath] = currentElement;
            continue;
        }

        const file = loadFile.apply(this, [resolvedPath]);

        // if the file don't return a command skip him
        if(!file) continue;

        // if the auto_categories options is enabled
        // set the category to the command
        if(options) {
            if(options.auto_categorise && options.categories) {
                file.setCategory(options.categories, options);
            }
        }

        addCommand.apply(this, [file]);
    }

    // load the directories
    for(const dir in directories) {
        if(options) {
            // if categories don't exist just create an empty array
            if(!options.categories) options.categories = [];

            // If the recursive options is enable
            // just add a categories to the currents in the array
            // else just set a new category
            options.recursive ?
                options.categories.push(directories[dir]) : options.categories[0] = directories[dir];
        }
        
        loadDirectory.apply(this, [dir, options]);

        // reset the categories of this directory
        // for the next iteration
        options.categories = [];
    }

    return this;
}

function loadFile(path) {
    if(isDirectory(path))
        return false;
    
    const requiredFile = require(path);

    // if the file export a command class
    if(requiredFile instanceof this.command) {
        return requiredFile;
    }

    // if the file export an object that fit the command class
    if(isCommandObj(requiredFile)) {
        return new this.command(
            requiredFile['entries'], requiredFile['executable'], requiredFile['options']
        );
    }

    // if the module export something else just throw a warn
    internalWarn(`${path} don't export a valid command`);
    return false;
}

function addCommand(command) {
    this.commands.push(command);
    internalConsole(command.entries[0] + " loaded");

    return this;
}

// Set the handler as a global variable and export it.
global['handler'] = handler;
module['exports'] = handler;
