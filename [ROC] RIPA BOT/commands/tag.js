const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ruta a la base de datos local
const dbPath = path.join(__dirname, '..', 'db.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Assign a warning tag to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to tag')
                .setRequired(true)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const moderator = interaction.user;

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('tag_select')
            .setPlaceholder('Select a warning tag')
            .addOptions([
                { label: '[O-W]', value: 'O-W' },
                { label: '[A-W]', value: 'A-W' },
                { label: '[RI-W]', value: 'RI-W' },
                { label: '[ROCMT-W]', value: 'ROCMT-W' },
                { label: '[BR-W]', value: 'BR-W' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `Please select a tag for ${targetUser.username}`,
            components: [row],
            ephemeral: true
        });

        const filter = i => i.customId === 'tag_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const selectedTag = i.values[0];

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('apply_tag')
                        .setLabel('Apply')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_tag')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Danger)
                );
            
            await i.update({
                content: `You are about to assign the tag **[${selectedTag}]** to **${targetUser.username}**. Do you want to proceed?`,
                components: [buttons]
            });
            
            const buttonFilter = btnInteraction => (btnInteraction.customId === 'apply_tag' || btnInteraction.customId === 'cancel_tag') && btnInteraction.user.id === interaction.user.id;
            const buttonCollector = interaction.channel.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

            buttonCollector.on('collect', async btnInteraction => {
                if (btnInteraction.customId === 'apply_tag') {
                    // Crea un objeto estructurado para el registro
                    const record = {
                        timestamp: new Date().toISOString(),
                        username: targetUser.username,
                        userId: targetUser.id,
                        tag: `[${selectedTag}]`,
                        moderator: moderator.username
                    };
                    
                    let db = [];
                    try {
                        if (fs.existsSync(dbPath)) {
                            const fileData = fs.readFileSync(dbPath, 'utf8');
                            if (fileData) {
                                db = JSON.parse(fileData);
                            }
                        }
                    } catch (error) {
                        console.error("Error crítico al leer o parsear db.json:", error);
                        await btnInteraction.update({ content: 'Error: Could not read the database. Please check the console.', components: [] });
                        return;
                    }

                    db.push(record);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

                    // Enviar mensaje embed al usuario
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Warning Notification')
                        .setDescription(`Greetings,\n\nA warning has been assigned to you with the next message:\n**${targetUser.username} | [${selectedTag}]**\n\nIf you have any questions, don't hesitate to ask it in this channel: https://discord.com/channels/1410302815863050260/1410302816832196704`)
                        .setFooter({ text: new Date().toUTCString() });
                    
                    try {
                        await targetUser.send({ embeds: [embed] });
                        await btnInteraction.update({ content: `Successfully applied the tag [${selectedTag}] to ${targetUser.username} and sent a notification.`, components: [] });
                    } catch (error) {
                        console.error(`Could not send DM to ${targetUser.username}.`);
                        await btnInteraction.update({ content: `Successfully applied the tag [${selectedTag}] to ${targetUser.username}, but **could not send them a DM**. They may have DMs disabled.`, components: [] });
                    }

                } else if (btnInteraction.customId === 'cancel_tag') {
                    await btnInteraction.update({ content: 'Operation cancelled.', components: [] });
                }
                buttonCollector.stop();
            });

            buttonCollector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Action timed out.', components: [] });
                }
            });

            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'You did not make a selection in time.', components: [] });
            }
        });
    },
};

