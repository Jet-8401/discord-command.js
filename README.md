<link href="./markdownStyle.css" rel="stylesheet"></link>

# discord-command.js

<p>
<img alt="npm" src="https://img.shields.io/npm/v/discord-command.js">
<img alt="npm" src="https://img.shields.io/npm/dt/discord-command.js">
<img alt="NPM" src="https://img.shields.io/npm/l/discord-command.js">
</p>

This package is a command manager for your discord bot developped for [Discord.js](https://discord.js.org/).

<br/>
<br/>

## Basics

### Installation: `npm install discord-command.js`
<br/>

Get the handler & the command constructor
```javascript
const { handler, command } = require("discord-command.js");
```
or
```javascript
const handler = require("discord-command.js");
const command = require("discord-command.js")["handler"];
```
<br/>

_`Note: handler is set to a global variable`_

<br/>

### <a id="basics-chapter1" class="title">1. Load a command</a>
---

```javascript 
handler.register(resolvable, options);
```

_`If the resolvable is a path to a folder it gonna read every other folder in it that doesn't match the filter`_

<br/>

- resolvable can be:
    - a path to a file/folder (relative or absolute) <def>(1)</def>
    - an object that fit the <a href="#basics-chapter2">command constructor</a>
    - a command

<br/>

- options:
    - **auto_categorise** : gonna set the category<br/>
    of the command the same name as its parent folder
    - **recursive** :  if the categories is set recursivly to the <br/>
    childrens of the current command
    - **filter** : callback function that gonna exclude the expected values

<br/>
<p><def>(1)</def> <description>All file must return a command.</description></p>
<br/>

### <a id="basics-chapter2" class="title">2. How to create a command</a>
---

Using the command constructor.
```javascript
const myCommand = new command(entries, executable, options);
```

Or by create a command object.
```javascript
const myCommand = {
    "entries",       // obligatory
    "executable",    // obligatory
    "options"        // optional
}
```

For creating a command you must have 3 keys
- entries : <span class="type">string|string[]</span> `(the entries of the command)`
- executable : <span class="type">function</span> `(a callback function that gonna be the executable for this command)`
- options: <span class="type">object|null</span> `(the options for this command)`

<br/>

---
#### `executable : `<span class="type">function({ channel, message, interaction, resolvable, content, args, bot })</span>
<br/>

| Parameter | Type | Description |
|---|:---:|---|
| channel | Disord.TextBasedChannels | The channel where the command has been invoked |
| message | Discord.Message | The message that triggered the command |
| interaction | Discord.Interaction | The interaction that triggered the command |
| resolvable | Discord.Message or Discord.Interaction | Interaction or a Message depends on wich has triggered the command |
| content | string | The content of the message without the command |
| args | string[] | The given arguments |
| bot | Discord.Client | The client of the bot (can be undefined if the bot was not defined before) |

<br/>
<br/>

###
---

#### `options : ` <span class="type">{ description, categories, childrens, interactionsTypes, interactionsOnly }</span>
<br/>

| Parameter | Type | Description |
|---|:---:|---|
| description | string | The description of the command |
| categories | string[] | The categories of the command |
| childrens | command[] | The childrens/subcommands of the command |
| interactionsTypes | string[] | The types of interaction that could triggered this command |
| interactionOnly | boolean | If the the command can be triggered only with interactions |
<br/>

### Examples of the same command
---
```javascript
module.exports = {
    entries: "ping",

    executable: async function pingFunction({resolvable}) {
        resolvable.reply("Pong !");
    },

    options: {
        interactionsTypes: ["APPLICATION_COMMAND"]
    }
}
```

```javascript
const { command } = require("discord-command.js");

const ping = new command(
    "ping",

    async function pingFunction({resolvable}) {
        resolvable.reply("Pong !");
    },

    { interactionsTypes: ["APPLICATION_COMMAND"] }
);

module.exports = ping;
```
<br/>

### <a id="basics-chapter3" class="title">3. Configure the handler</a>
---

#### <span class="litle-title">Set the bot</span>

First of all you need to specify the client on wich your bot run on by doing
```javascript
handler.cache.set('clientBot', /* Your client here */);
```
If you don't do that when you gonna try to get the `bot` parameter into a command that will return you an `undefined` value.

<br/>

#### <span class="litle-title">Set any parameter of the configuration</span>

The `handler` have a `configuration` variable with two function (`get & set`).
<br/>
In that <span class="interFile">[folder](./src/configuration.json)</span> you will see multiple variables that the `handler` use, you can personalise them with the `set` function like so
```javascript
handler.configuration.set("prefix", "!");
```
You must enter the key and the value that you want to applied to it `(the value must be the same type as the one before)`.

<br/>
<br/>

### <a id="basics-chapter4" class="title">4. Execute the commands</a>
---

#### <span class="litle-title">Using a global function</span>
You can use a global function that works for `Discord.Message` and `Discord.Interaction`
```javascript
Bot.on("messageCreate", message => handler.resolve(message));
Bot.on("interactionCreate", interaction => handler.resolve(interaction));
```

<br/>

#### <span class="litle-title">Using separated functions</span>
You can using different functions too
```javascript
Bot.on("messageCreate", message => handler.executeMessage(message));
Bot.on("interactionCreate", interaction => handler.executeInteraction(interaction));
```

<br/>

#### <span class="litle-title">Execute a command without an Interaction or Message
```javascript
const ping = handler.hasCommand("ping");

ping.executable(); // executable is the main function of the command
```

<br/>

_`Note : we don't give any arguments to the executable so we have to make that the command don't ask for them.`_

<br/>
<br/>
<br/>

## Advanced

<br/>
<br/>

### <a id="advanced-chapter1" class="title">1. Statics commands</a>
---

Static commands are some commands that affect a certain category of command _`(like the default one)`_ and act almost like a child of theme, that's mean that the command can be called like it was a child but with a specific prefix _`("--" by default)`_.
Like for example if i create a command <command>info</command> that gonna tell me every utils informations of the previous/parent command i would call it like that : `-ping --info`, the utility of that is that in the <command>info</command> executable the `command` argument gonna point into the previous command _`(in that case "ping")`_. The other difference between a static command and a children is that the static don't gonna be a part of the command but a part of the category.

#### <span class="litle-title">Examples

```javascript
const infoCommand = {
    entries: 'info',
    executable: ({message, command}) => {
        message.reply(`The categories of ${command.entries[0]} is ${command.categories.join('-')}`);
    }
    options: {
        categories
    }
}

handler.staticCommands.add(infoCommand);
```

If i type `-ping --info` into the chat and <command>ping</command> was loaded into `other/` folder and the `auto_categorise` was enabled _`(ping will have 'other' as a category)`_

The bot would reply to me with that message : `The categories of ping is utils-other`

<br/>
<br/>

#### <span class="litle-title">How to use

To add a command you can use `add` function in `handler.staticCommands.add(`<span class="type">obj</span>`, `<span class="type">categories</span>`)`

Function description

| Parameter | Type | Description |
|---|:---:|---|
| <span class="type">obj</span> | `obj` or `command` | A command or an object that fit the [command constructor](#basics-chapter2) |
| <span class="type">categories</span> | `string[]` or `null` | All categories that will be affected by that command

<br/>

_`Note :  if categories is not defined the command gonna go into the default category (will affect every categories)`_

<br/>

### <a id="advanced-chapter2" class="title">2. Voice handler</a>
---

The voice handler add a queu and a bunch of functions and properties per guild to help through voice connection.

<br/>

#### <span class="litle-title">How to use

First you need to get the queu from a guildId by using
```javascript
handler.voice.get(guildId);
```

Function Description

`Get the queu of of the current guild and if the queu is not set,`
<br/>
`create it and attribute it.`

<br/>

#### <span class="litle-title">What is a queu ?
A `queu` is an object to manipulates voices between guilds more easily.

_Methods and properties of a `queu`_

<br/>

| Property | Type | Description |
|---|:---:|---|
| content | `Array<any>` | The content of the current queu |
| maxSize | `number` | The maximum size of the queu |
| currentlyPlaying | `boolean` | If the queu is playing an audio ressource |
| lastSong | `any` | The last song the queu has played |
| isLoop | `boolean` | If the queu is in a loop |
| connection | `false` or `Voice.VoiceConnection` | False is the connection to the voice channel is not yet created |
| audioPlayer | `Voice.AudioPlayer` | The player that gonna play the song into the channel |

<br/>
<br/>

| Methods | Arguments | Description |
|---|:---:|---|
| add | `item: any, force: boolean` | Add something to the queu. `force` param is to enabled if you want to 'break' the maximum size of the queu, that means that if the length of the curernt queu is too long to add something eles the first element on the queu gonna be deleted and the item gonna be pushed into the end. By default the maximum size is set to 100 and can be change into `handler.voice.maxSize` |
| play | `ressource: Voice.AudioRessource, voiceChannel: Discord.VoiceChannel/null` | Make the bot play a ressource into a voice channel |
| createVoiceConnection | `voiceChannel: Discord.VoiceChannel` | Create a voice connection to a voice channel |
| hasVoiceConnection | | Check if the queu have a voice connection |
| regenerateAudioPlayer | `options: Voice.CreateAudioPlayerOptions/undefined` | Regenerate the audioPlayer of the queu |
| next | | Return the incoming item into the queu |
| getContent | `index: number` | Get the content at the given index into the queu return `boolean` if the index return something |


