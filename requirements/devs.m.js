const { GuildMember, Client } = require("discord.js");
const { internalError } = require("./utils.m");

const devs = {};

devs['enabled'] = false;

/**
 * @type {Array<string>}
 */
devs['whiteList'] = [];

/**
 * Add a role or a user id to the white list.
 * 
 * @param {string|Array<string>} p 
 */
devs['addWhiteList'] = function addDevToWhiteList(p) {
    // add a single item
    function add(p) {
        if(typeof p === "string") {
            devs.whiteList.push(p);
            return this;
        }

        return this;
    }

    // add every item in an array
    if(p instanceof Array) {
        for(const toAdd of p) {
            add(toAdd);
        }
        return this;
    }

    if(!add(p)) return internalError("the parameter has to be a String or an Array of String!");
}

/**
 * Check if the given member is in the white list.
 * 
 * @param {GuildMember} member 
 */
devs['check'] = function checkWhiteList(member) {
    if(!this.enabled) return true;

    // check if the id is in the white list
    if(this.whiteList.includes(member.id)) return true;

    // check if the member role is on the white list
    for(const whiteList of devs.whiteList) {
        if(member.roles.cache.find( function(value) {return value.name == whiteList} )) return true;
    }

    return false;
}

module['exports'] = devs;
