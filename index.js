// ===================================
// 1. EXPRESS SERVER FOR RENDER (Keep-Alive) - ADD THIS
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
// 2. DISCORD BOT CODE - MODIFIED SECTION
// ===================================

// ** 🛑 REMOVED: require("dotenv").config(); 🛑 ** // The configuration is now loaded directly from process.env provided by Render.

const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Client, GatewayIntentBits, Partials, Collection, Routes } = require("discord.js");
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');

// Client initialization remains the same
client = new Client({
// ... (rest of your client initialization code is unchanged)
});

// ... (your error logging, player initialization, and command loading logic is unchanged)

//Authenticate with Discord via environment token
if (!process.env.TOKEN) {
    // ** ⚠️ MODIFIED: The custom check is changed to no longer mention the local .env file. ⚠️ **
    console.log(`[ELITE_ERROR] The Discord bot token is missing. Please ensure the 'TOKEN' environment variable is set correctly on the Render dashboard.`);
    process.exit(0)
}

// Login using the token from Render's environment variables
client.login(process.env.TOKEN)
.catch((err) => {
    // ** ⚠️ MODIFIED: The custom error message is changed. ⚠️ **
    console.log(`[ELITE_ERROR] Bot could not login and authenticate with Discord. 
        Please check the 'TOKEN' environment variable on Render's dashboard. 
        (Using token starting with: ${process.env.TOKEN ? process.env.TOKEN.substring(0, 5) + '...' : 'N/A'})
        Error Trace: ${err}`);
})

// ... (rest of your verbose logging logic is unchanged)
