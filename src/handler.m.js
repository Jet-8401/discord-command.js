'use strict';

/**
 * Module requirements.
 */
const fs = require("fs");
const Discord = require("discord.js");
const { internalError, warn, configuration, parse, internalConsole } = require("../requirements/utils.m.js");

/**
 * Tell if all commands is loaded.
 */
let commandLOADED = false;

const handler = {};

handler['command'] = require("./command.m.js");

handler['configuration'] = configuration;

handler['devs'] = require("../requirements/devs.m.js");

handler['parse'] = parse;

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

// set the cache
Object.defineProperty(handler, "cache", {value: {}});

/**
 * Add a command to the handler.
 * 
 * @param {string|command} resolvable a folder path to a directory of commands using `file://` protocol or a command
 * @returns 
 */
handler['register'] = function commandRegister(resolvable) {
    if(!resolvable)
        return internalError("resolvable argument must be provided");

    if(typeof resolvable === "string") {

        const fullPATH = resolvable.startsWith(__dirname) ? resolvable : fs.realpathSync(__dirname + "../../../" + resolvable);

        if(!fs.existsSync(fullPATH))
            return internalError(`the given path don't exist ${fullPATH}`);
    
        // set the loaded variable to true
        commandLOADED = true;
    
        if(isDirectory(fullPATH))
            return loadDirectory.apply(this, [fullPATH]);
    
        return loadFile.apply(this, [fullPATH]);

    } else if(resolvable instanceof this.command) {

        internalConsole(resolvable.entries[0] + " loaded");
        this.commands.push(resolvable);
        return this;

    }
}

/**
 * Resolve a Discord.Message or a Discord.Interaction and split the parameter
 * into its good place.
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
    if(!this.devs.check(interaction.member)) return;

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
 * @param {?string} commandName
 */
handler['executeMessage'] = function executeMessage(message, commandName) {
    // check if devMod is enable
    if(!this.devs.check(message.member)) return;

    if(!message instanceof Discord.Message)
        return internalError("message parameter must be an instance of Discord.Message");

    // block the execution if the prefix isn't right
    if(!message.cleanContent.startsWith(this.configuration.get("prefix").isValid))
        return;

    // block the execution if the message provided come from a bot
    // and the option is enable
    if(this.configuration.get("block_bot_messages") && message.author.bot)
        return;

    // if the comandName is not specified, parse the message
    // and get the name of the comand to execute
    const cmd_name = typeof commandName === "string" ? commandName : this.parse(message)["command"];

    // check if the command requested exist
    const command = this.hasCommand(cmd_name, {filter: (value) => !value.interactionsOnly});
    if(command) return command.execute(message);

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
    if(!this.commands.loaded)
        return !Boolean(warn("no commands has been loaded (empty handler)")); // return false

    const {strict, strictEntries, filter} = options;

    // at refactorized...

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
 * 
 * @param {string|handler.command} command 
 */
handler['unload'] = function unLoadCommand(command) {
    for(let i = 0; i <  this.commands.length; i++) {
        for(const entry of this.commands[i]['entries']) {
            if(entry === command) {
                internalConsole(`${command} is unload!`);
                this.commands.splice(i, 1);
                return true;
            }
        }
    }

    return false;
}

function isDirectory(path) {
    return fs.statSync(path).isDirectory();
}

function loadDirectory(path) {
    for(const file of fs.readdirSync(path))
        loadFile.apply(this, [`${path}\\${file}`]);

    return this;
}

function loadFile(path) {
    if(isDirectory(path))
        return this;

    const command = require(path);

    if(!command || !(command instanceof this.command))
        return internalError(`loaded file failed (${path}) the export value must be an instance of handler.command or command`, "skiped");
    
    this.commands.push(command);
    internalConsole(`${command.entries[0]} loaded !`);

    return this;
}

/**
 * Export.
 */
module['exports'] = handler;
