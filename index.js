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
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Prime Leader is Ready!');
    } catch (err) {
        console.error("Command Registration Error:", err);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'start') {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Combine all your security cookies: Session, Server ID, and the SEC token
            const myCookies = `ATERNOS_SESSION=${process.env.ATERNOS_SESSION}; ATERNOS_SERVER=${process.env.ATERNOS_SERVER}; ${process.env.ATERNOS_SEC_NAME}=${process.env.ATERNOS_SEC_VALUE}`;
            
            const res = await fetch(`https://aternos.org/panel/ajax/status.php?s=start`, {
                method: 'GET',
                headers: {
                    'Cookie': myCookies,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://aternos.org/server/'
                }
            });

            const data = await res.text();
            console.log("Aternos Response:", data);

            await interaction.editReply("Signal sent! The SMP should be starting now.");
            
            // Send the status update to #server-status
            const channel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle("Prime SMP Status")
                    .setDescription("🟡 **Starting...** Checking Aternos Panel. Please wait for the green light!")
                    .setColor(0xFFFF00)
                    .setFooter({ text: "Prime SMP Official Bot" })
                    .setTimestamp();
                
                await channel.send({ embeds: [embed] });
            }

        } catch (e) {
            console.error("Fetch Error:", e);
            await interaction.editReply("Error: Check your Render variables and Cookie values.");
        }
    }
});

client.login(process.env.TOKEN);
