// ===================================
// RENDER DEPLOYMENT FIXES: KEEP-ALIVE SERVER AND ENV VARS
// ===================================
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use Render's dynamically assigned PORT

// Start an Express server for Render's required keep-alive function
app.get('/', (req, res) => {
    res.send('Elite Music Bot is alive!');
});

app.listen(port, () => {
    console.log(`Render web server listening on port ${port}`);
});

// ===================================
// DISCORD BOT CODE (ENVIRONMENT & INTENTS FIXES APPLIED)
// ===================================

// ** 🛑 REMOVED: require("dotenv").config(); 🛑 ** // Render automatically loads environment variables.
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Client, GatewayIntentBits, Partials, Collection, Routes } = require("discord.js");
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');

// ✅ FIX: Client is correctly declared with 'const' to ensure intents are passed.
const client = new Client({
    intents: [ //Sets the necessary intents which discord requires
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.AutoModerationExecution,
    ],
    partials: [
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

//Added logging for exceptions and rejection
process.on('uncaughtException', async function(err) {
    var date = new Date();
    console.log(`Caught Exception: ${err.stack}\n`);
    fs.appendFileSync('exception.txt', `${date.toGMTString()}: ${err.stack}\n`);
});

process.on('unhandledRejection', async function(err) {
    var date = new Date();
    console.log(`Caught Rejection: ${err.stack}\n`);
    fs.appendFileSync('rejection.txt', `${date.toGMTString()}: ${err.stack}\n`);
});

//Discord-Player initialisation
const defaultConsts = require(`./utils/defaultConsts`);
const player = new Player(client, {
    smoothVolume: process.env.SMOOTH_VOLUME,
    ytdlOptions: defaultConsts.ytdlOptions
})
player.extractors.loadMulti(DefaultExtractors)
player.extractors.register(YoutubeiExtractor, {
    authentication: process.env.YT_CREDS ? process.env.YT_CREDS : null,
})

//Initialise commands through JSON
const commands = [];
client.commands = new Collection(); //Creates new command collection
fs.readdirSync("./commands/").forEach((dir) => {
    const commandFiles = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) { //For each file, retrieve name/desc and push it as JSON
        const command = require(`./commands/${dir}/${file}`);
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
})

//Register all of the commands
client.once('ready', async function() {
    console.log(`[ELITE_CONFIG] Loading Configuration... (Config Version: ${process.env.CFG_VERSION || 'N/A'})`)
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("[ELITE_CMDS] Commands registered (production)!");
    } catch (err) {
        console.error(err);
    }
})

const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js")); //Searches all .js files
for (const file of eventFiles) { //For each file, check if the event is .once or .on and execute it as specified within the event file itself
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, commands));
    } else {
        client.on(event.name, (...args) => event.execute(...args, commands));
    }
}

//Authenticate with Discord via environment token
if (!process.env.TOKEN) {
    // MODIFIED: Corrected error message.
    console.log(`[ELITE_ERROR] The Discord bot token is missing. Please ensure the 'TOKEN' environment variable is set correctly on the Render dashboard.`);
    process.exit(0)
}

client.login(process.env.TOKEN)
.catch((err) => {
    // MODIFIED: Corrected error message.
    console.log(`[ELITE_ERROR] Bot could not login and authenticate with Discord. 
        Please check the 'TOKEN' environment variable on Render's dashboard. 
        (Using token starting with: ${process.env.TOKEN ? process.env.TOKEN.substring(0, 5) + '...' : 'N/A'})
        Error Trace: ${err}`);
})

//Verbose logging for debugging purposes
const verbose = process.env.VERBOSE ? process.env.VERBOSE.toLocaleLowerCase() : "none";
if (verbose == "full" || verbose == "normal") {
    //Both normal and full verbose logging will log unhandled rejects, uncaught exceptions and warnings to the console
    process.on("unhandledRejection", (reason) => console.error(reason));
    process.on("uncaughtException", (error) => console.error(error));
    process.on("warning", (warning) => console.error(warning));

    if (verbose == "full") {
        console.log(`[ELITE_CONFIG] Verbose logging enabled and set to full. This will log everything to the console, including: discord-player debugging, unhandled rejections, uncaught exceptions and warnings to the console.`)
        
        //Full verbose logging will also log everything from discord-player to the console
        console.log(player.scanDeps());player.on('debug',console.log).events.on('debug',(_,m)=>console.log(m));
    }

    else if (verbose == "normal") {
        console.log(`[ELITE_CONFIG] Verbose logging enabled and set to normal. This will log unhandled rejections, uncaught exceptions and warnings to the console.`)
    }
}

else {
    console.log(`[ELITE_CONFIG] Verbose logging is disabled.`)
}
