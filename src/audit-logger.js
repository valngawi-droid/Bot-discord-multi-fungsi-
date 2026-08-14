import { EmbedBuilder, WebhookClient } from 'discord.js';

export class AuditLogger {
  constructor(url) {
    this.webhook = url ? new WebhookClient({ url }) : null;
  }

  get configured() { return Boolean(this.webhook); }

  async send(title, description, color = 0x5865f2) {
    if (!this.webhook) return false;
    const safe = redact(String(description || '')).slice(0, 4000);
    try {
      await this.webhook.send({
        username: 'AiPall Audit Log',
        embeds: [new EmbedBuilder().setTitle(String(title).slice(0, 256)).setDescription(safe || '-').setColor(color).setTimestamp()],
        allowedMentions: { parse: [] }
      });
      return true;
    } catch (error) {
      console.error('Gagal mengirim audit webhook:', error.message);
      return false;
    }
  }

  command(interaction) {
    return this.send('Slash Command', `/${interaction.commandName} oleh ${interaction.user.tag} (${interaction.user.id})\nServer: ${interaction.guild?.name || '-'}\nChannel: ${interaction.channel?.name || interaction.channelId}`);
  }

  error(location, error) {
    return this.send('Error Bot', `${location}\n${error instanceof Error ? error.message : String(error)}`, 0xed4245);
  }

  destroy() { this.webhook?.destroy(); }
}

function redact(text) {
  return text
    .replace(/https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w.-]+/gi, '[WEBHOOK_REDACTED]')
    .replace(/(token|api[_ -]?key|authorization)\s*[:=]\s*\S+/gi, '$1=[REDACTED]');
}
