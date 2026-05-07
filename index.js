const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const aternos = require('aternos-api'); 
const express = require('express');

// 1. Web Server for Render (Keep Alive)
const app = express();
app.get('/', (req, res) => res.send('Bot is Awake!'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 2. Setup the /start Command
const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Starts the Prime SMP')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log('Prime SMP Bot is Online!');
    // Register commands
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    
    // Start the status watcher loop
    setInterval(updateStatus, 30000); // Checks every 30 seconds
});

// 3. The Logic for /start
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'start') {
        try {
            await aternos.startServer(process.env.ATERNOS_SESSION);
            await interaction.reply({ content: "Command sent! Checking status...", ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: "Error: Aternos session might be expired.", ephemeral: true });
        }
    }
});

// 4. The Status Updater
async function updateStatus() {
    const statusChannel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
    const info = await aternos.getServerInfo(process.env.ATERNOS_SESSION); 

    const statusEmbed = new EmbedBuilder()
        .setTitle("Prime SMP Status")
        .setDescription(info.status === 'on' ? "🟢 **Online**" : info.status === 'starting' ? "🟡 **Starting...**" : "🔴 **Offline**")
        .setColor(info.status === 'on' ? 0x00FF00 : 0xFF0000)
        .addFields({ name: 'Players', value: `${info.players}/${info.maxPlayers}` })
        .setTimestamp();

    // Fetch the last message and edit it (so you don't spam)
    const messages = await statusChannel.messages.fetch({ limit: 1 });
    const lastMsg = messages.first();
    
    if (lastMsg && lastMsg.author.id === client.user.id) {
        await lastMsg.edit({ embeds: [statusEmbed] });
    } else {
        await statusChannel.send({ embeds: [statusEmbed] });
    }
}

client.login(process.env.TOKEN);
