/**
 * Modules requirements.
 */

const voiceHandler = {};

voiceHandler['lastSong'] = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

voiceHandler['queu'] = {
    maximum: 100,

    // /**
    //  * Historical is a variable for setting a permanent historical by saving the element
    //  * that goes out of the queu by saving them into a file, by exemple that can be usefull if you
    //  * queu works with link/string that can be saved to played them randomly like a playlist.
    //  * 
    //  * Options:
    //  *  - activate: {Boolean} if the historical is activate
    //  *  - path: {String}
    //  */
    // historical: {
    //     activate: false,
    //     path: null,
    //     autoSave: false,
    //     cooldown: 10000
    // },

    /**
     * Attach the object/value of you choice to a `guildId`, for example that can be
     * a link, a Buffer, an Object, but for a music queu with a maximum ammout (`100 by default`) 
     * that you can set to wathever you want, if you don't want a maximum value fot the queu
     * you can just use the `Infinity` variable.
     * 
     * If the function false is that the queu is at it's maximum size expected.
     * Else return the new length of the array.
     * 
     * @param {string} guildId 
     * @param {*} value the value to attach to the `guildId` (that can be a link, a Buffer, etc...)
     * @param {Object} options
     * @param {boolean} options.force with the `force` options you can avoid the maximum limitations,
     * if it set to true, that gonna forced to add the element in the array but it still remove the last element in it,
     * (it can be forced to add new elements but it can't reach more than his maximum limitions)
     * @returns {Number|false}
     */
    add: function addQueu(guildId, value, options) {
        /**@type {Array} */
        let queu = guildCache.queues.get(guildId);

        if(options.force) {
            queu.unshift(value);
            if(queu.length > this.maximum) 
                queu.pop();
            return queu.length;
        }

        if(queu.length !== this.maximum) {
            return queu.unshift(value);
        }

        return false;
    },

    /**
     * Get the next element that is attach to the `guildId` and delete it.
     * 
     * @param {string} guildId 
     * @returns {*}
     */
    nextOf: function nextInQueu(guildId) {
        return guildCache.queues.get(guildId).pop();
    }
};

const guildCache = {};

guildCache['queues'] = {
    setGuild: function setGuild(guildId) {
        const array = [];
        Object.defineProperty(this, guildId, {value: array});
        return array;
    },

    get: function getGuild(guildId) {
        if(this[guildId]) return this[guildId];
        return this.setGuild(guildId);
    }
};

module['exports'] = voiceHandler;
