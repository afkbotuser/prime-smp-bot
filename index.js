const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { AternosAPI } = require('aternos-api-improved'); 
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot is Awake!'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const aternos = new AternosAPI(process.env.ATERNOS_SESSION);

const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Starts the Prime SMP')
].map(command => command.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('Prime SMP Bot is Online!');
    setInterval(updateStatus, 60000); // Check status every 60 seconds
});

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'start') {
        try {
            const server = (await aternos.getServers())[0]; // Gets your first server
            await server.start();
            await interaction.reply({ content: "SMP is starting! Check the status channel.", ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: "Failed to start. Check if your ATERNOS_SESSION is still valid.", ephemeral: true });
        }
    }
});

async function updateStatus() {
    try {
        const statusChannel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
        const server = (await aternos.getServers())[0];
        
        const statusEmbed = new EmbedBuilder()
            .setTitle("Prime SMP Status")
            .setDescription(`Status: **${server.statusString}**`)
            .setColor(server.statusString === 'Online' ? 0x00FF00 : 0xFF0000)
            .addFields({ name: 'Players', value: `${server.players}/${server.maxPlayers}` })
            .setTimestamp();

        const messages = await statusChannel.messages.fetch({ limit: 1 });
        const lastMsg = messages.first();
        if (lastMsg && lastMsg.author.id === client.user.id) await lastMsg.edit({ embeds: [statusEmbed] });
        else await statusChannel.send({ embeds: [statusEmbed] });
    } catch (err) { console.log("Status update failed"); }
}

client.login(process.env.TOKEN);
