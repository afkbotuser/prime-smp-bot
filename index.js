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
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Prime Leader Bot is ready!');
    } catch (err) { console.error("Command Error:", err); }
    
    setInterval(updateStatus, 60000); // Update every minute
});

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'start') {
        await interaction.deferReply({ ephemeral: true });

        try {
            const res = await fetch(`https://aternos.org/panel/ajax/status.php?s=start`, {
                method: 'GET',
                headers: { 
                    'Cookie': `ATERNOS_SESSION=${process.env.ATERNOS_SESSION}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://aternos.org/server/'
                }
            });

            const data = await res.text();
            console.log("Aternos Response:", data);

            await interaction.editReply("Sent start signal! Check #server-status.");
            updateStatus(); // Immediate refresh
        } catch (e) {
            await interaction.editReply("Error connecting to Aternos. Please check your ATERNOS_SESSION cookie!");
        }
    }
});

async function updateStatus() {
    try {
        const channel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
        if (!channel) return;

        // Note: Aternos Web API is very strict. 
        // This simple status check helps avoid getting your IP banned.
        const embed = new EmbedBuilder()
            .setTitle("Prime SMP Status")
            .setDescription("The bot is watching the panel for changes...")
            .setColor(0x5865F2)
            .addFields({ name: 'Instruction', value: 'If server is offline, use `/start` in the commands channel.' })
            .setFooter({ text: "Auto-updates every minute" })
            .setTimestamp();

        const messages = await channel.messages.fetch({ limit: 1 });
        const lastMsg = messages.first();

        if (lastMsg && lastMsg.author.id === client.user.id) {
            await lastMsg.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
    } catch (e) { console.log("Status update error:", e.message); }
}

client.login(process.env.TOKEN);
