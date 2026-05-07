const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.get('/', (req, res) => res.send('Prime SMP Bot is Online'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Starts the Prime SMP')
].map(command => command.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('✅ Bot is ready!');
});

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'start') {
        await interaction.deferReply({ ephemeral: true });

        try {
            // This URL tells Aternos to start your SPECIFIC server ID
            const url = `https://aternos.org/panel/ajax/status.php?s=start`;
            
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cookie': `ATERNOS_SESSION=${process.env.ATERNOS_SESSION}; ATERNOS_SERVER=${process.env.ATERNOS_SERVER}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://aternos.org/server/'
                }
            });

            await interaction.editReply("Signal sent! The SMP should be starting now.");
            
            // Send the status update to #server-status
            const channel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
            const embed = new EmbedBuilder()
                .setTitle("Prime SMP Status")
                .setDescription("🟡 **Starting...** Checking Aternos Panel.")
                .setColor(0xFFFF00)
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });

        } catch (e) {
            await interaction.editReply("Error: Check your Render variables.");
        }
    }
});

client.login(process.env.TOKEN);
