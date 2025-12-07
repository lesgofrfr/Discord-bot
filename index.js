const { Client, GatewayIntentBits, IntentsBitField } = require('discord.js');
const express = require('express');

// --- Keep-Alive Web Server Configuration ---

// Render and other hosting providers require the app to listen on the PORT environment variable.
const PORT = process.env.PORT || 3000;

// Initialize Express server
const app = express();

// Simple health check endpoint for Render and external pinger services (Uptime Robot, etc.)
app.get('/', (req, res) => {
    // Respond to the health check to confirm the bot service is awake and running.
    res.send('Discord bot is active and running!');
});

// Start the web server. This keeps the service alive 24/7.
app.listen(PORT, () => {
    // In production (Render), this message will appear in your Render logs.
    console.log(`Keep-Alive Web Server is listening on port ${PORT}`);
});


// --- Discord Bot Configuration ---

// The Discord Token is retrieved from the environment variable set on Render.
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("FATAL ERROR: DISCORD_TOKEN environment variable is not set. Please add it to Render's environment settings.");
    // In a production environment like Render, exiting is better than running without authentication.
    process.exit(1); 
}

// Define the required intents (permissions) for the bot.
// Intents are critical permissions the bot needs to interact with Discord features.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Allows bot to see and cache guild (server) data
        GatewayIntentBits.GuildMessages,    // Allows bot to see message events in guilds
        GatewayIntentBits.MessageContent,   // CRITICAL: Allows bot to read the content of messages for commands (required for !ping)
        IntentsBitField.Flags.GuildMembers, // Allows bot to access member data
    ]
});

// Event: Bot is ready
client.on('ready', () => {
    console.log(`Successfully logged in as ${client.user.tag}!`);
    
    // Set a custom status that shows the bot is active
    client.user.setActivity('for commands (24/7 active)', { type: 3 }); // Type 3 is "Watching"
});

// Event: Handle incoming messages
client.on('messageCreate', message => {
    // Ignore messages from other bots or the bot itself
    if (message.author.bot) return;

    // --- Example Commands ---

    // !ping command
    if (message.content.toLowerCase() === '!ping') {
        const pingTime = Date.now() - message.createdTimestamp;
        message.channel.send(`📡 Pong! Latency is ${pingTime}ms. API Latency is ${Math.round(client.ws.ping)}ms.`);
    }

    // !help command
    if (message.content.toLowerCase() === '!help') {
        const helpMessage = "Hello! I am a 24/7 active bot hosted on Render.\n\nAvailable Commands:\n- `!ping`: Check my response latency.\n- `!status`: Check my current uptime.";
        message.channel.send(helpMessage);
    }

    // !status command
    if (message.content.toLowerCase() === '!status') {
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);

        message.channel.send(`✅ I am active and have been running for: ${days} days, ${hours} hours, and ${minutes} minutes.`);
    }
});

// Log in to Discord using the token
client.login(TOKEN);
