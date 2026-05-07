const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.get('/', (req, res) => res.send('Prime SMP Bot is Active'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Starts the Prime SMP')
].map(command => command.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('✅ Bot is logged in and ready!');
    setInterval(updateStatus, 60000);
});

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'start') {
        await interaction.deferReply({ ephemeral: true });
        // Direct call to Aternos
        const res = await fetch(`https://aternos.org/panel/ajax/status.php?s=start`, {
            headers: { 'Cookie': `ATERNOS_SESSION=${process.env.ATERNOS_SESSION}` }
        });
        await interaction.editReply("Sent start signal! Check #server-status.");
    }
});

async function updateStatus() {
    try {
        const channel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
        // This simulates a status check
        const embed = new EmbedBuilder()
            .setTitle("Prime SMP Status")
            .setDescription("The bot is watching the panel...")
            .setColor(0x5865F2)
            .setFooter({ text: "Auto-updates every minute" });

        const messages = await channel.messages.fetch({ limit: 1 });
        const lastMsg = messages.first();
        if (lastMsg && lastMsg.author.id === client.user.id) await lastMsg.edit({ embeds: [embed] });
        else await channel.send({ embeds: [embed] });
    } catch (e) { console.log("Status update error"); }
}

client.login(process.env.TOKEN);
