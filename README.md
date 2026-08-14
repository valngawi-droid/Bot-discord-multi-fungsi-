# Bot Discord Multi Fungsi + AI LMArena

Bot Discord berbahasa Indonesia untuk:

- membuat dan menghapus **role, kategori, text/voice/announcement/forum/stage channel** melalui slash command;
- menyusun seluruh server dari **template JSON yang idempotent** (item yang sudah ada tidak dibuat ulang);
- mengatur channel private dan akses berbasis role;
- chat AI melalui endpoint **OpenAI-compatible**, termasuk penyedia/bridge LMArena;
- percakapan AI per pengguna/per channel, reset riwayat, mention bot, dan pembatasan channel AI;
- utilitas `/clear`, `/serverinfo`, dan `/ping`.

> **Catatan LMArena:** ekosistem LMArena memiliki beberapa layanan/bridge dengan URL berbeda. Bot tidak mengasumsikan satu URL tidak resmi tertentu. Isi base URL, API key, dan model dari layanan OpenAI-compatible yang memang Anda gunakan. API key hanya dibaca dari `.env`, tidak pernah ditaruh di source code atau Discord.

## Persyaratan

- Node.js 20.11 atau lebih baru
- Aplikasi/bot dari [Discord Developer Portal](https://discord.com/developers/applications)
- Endpoint AI yang mendukung `POST /v1/chat/completions`

## Instalasi

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```env
DISCORD_TOKEN=token_bot_discord
DISCORD_CLIENT_ID=id_aplikasi_discord
DISCORD_GUILD_ID=id_server_uji

LMARENA_BASE_URL=https://endpoint-provider-anda.example/v1
LMARENA_API_KEY=sk-rahasia
LMARENA_MODEL=nama-model-persis
```

`DISCORD_GUILD_ID` direkomendasikan ketika pengembangan agar slash command muncul segera. Jika dikosongkan, `npm run deploy` mendaftarkan command global dan propagasinya dapat memerlukan waktu.

### Pengaturan Developer Portal

1. Buka **Bot**, aktifkan **Message Content Intent** jika ingin fitur balas saat bot di-mention. `/ai chat` tetap menjadi cara utama memakai AI.
2. Pada **OAuth2 > URL Generator**, pilih scope `bot` dan `applications.commands`.
3. Beri bot permission yang diperlukan: `View Channels`, `Send Messages`, `Read Message History`, `Manage Channels`, `Manage Roles`, dan `Manage Messages`. Tambahkan `Kick Members`/`Moderate Members` hanya jika template role memang memerlukannya.
4. Undang bot dan letakkan role bot **di atas role-role yang akan dikelolanya**. Discord tidak mengizinkan bot mengelola role yang lebih tinggi.
5. Jangan memakai permission `Administrator` untuk bot jika permission granular sudah cukup.

Daftarkan command dan jalankan:

```bash
npm run deploy
npm start
```

## Command

| Command | Fungsi | Permission pengguna |
|---|---|---|
| `/setup-server` | Preview/apply template JSON | Administrator |
| `/role buat/hapus/daftar` | Kelola role | Manage Roles |
| `/category buat/hapus/daftar` | Kelola kategori | Manage Channels |
| `/channel buat/hapus/daftar` | Kelola channel | Manage Channels |
| `/ai chat/reset/status` | Chat dan status AI | Semua anggota |
| `/clear` | Hapus 1–100 pesan terbaru | Manage Messages |
| `/serverinfo`, `/ping` | Informasi umum | Semua anggota |

Command penghapusan meminta kata `HAPUS`. Penghapusan kategori hanya diizinkan jika kategori kosong. `/setup-server` bersifat **non-destruktif**: hanya membuat yang belum ada dan tidak menghapus atau menimpa item lama.

## Setup server sesuai keinginan

Salin dan ubah contoh:

```bash
cp config/server-setup.example.json config/server-setup.json
```

Di Discord:

1. Jalankan `/setup-server aksi:Preview`, lalu unggah file JSON tersebut.
2. Periksa daftar perubahan.
3. Jalankan `/setup-server aksi:Apply template:<file> konfirmasi:APPLY`.

Struktur ringkas:

```json
{
  "roles": [
    {
      "name": "Member",
      "color": "#3498DB",
      "hoist": false,
      "mentionable": true,
      "permissions": []
    }
  ],
  "categories": [
    {
      "name": "KOMUNITAS",
      "everyone": { "allow": [], "deny": [] },
      "roles": {
        "Member": { "allow": ["ViewChannel"], "deny": [] }
      },
      "channels": [
        { "name": "umum", "type": "text", "topic": "Obrolan umum" },
        { "name": "Ngobrol", "type": "voice", "userLimit": 0, "bitrate": 64000 }
      ]
    }
  ]
}
```

Tipe channel: `text`, `voice`, `announcement`, `forum`, atau `stage`. Nama permission memakai nama flag discord.js, misalnya `ViewChannel`, `SendMessages`, `ManageMessages`, `KickMembers`, dan `ModerateMembers`.

Permission kategori otomatis digabungkan ke channel di dalamnya. Aturan channel dapat menambah atau mengubah aturan kategori. Semua role yang disebut pada `categories[].roles` atau `channels[].roles` wajib dideklarasikan pada array `roles`.

## Konfigurasi AI

- `AI_CHANNEL_IDS`: ID channel dipisahkan koma; kosong berarti semua channel.
- `AI_REPLY_ON_MENTION=false`: matikan respons mention.
- `AI_SYSTEM_PROMPT`: karakter/instruksi bot.
- `AI_MAX_TOKENS`, `AI_TEMPERATURE`, `AI_TIMEOUT_MS`: kontrol request.

Riwayat hanya disimpan di memori (maksimal 12 pesan per pengguna/channel) dan hilang saat bot restart. Bot tidak mencetak API key ke log. `/ai status` hanya menunjukkan apakah key sudah terisi.

Jika provider memberi endpoint lengkap seperti `https://host.example/v1`, masukkan nilai itu sebagai `LMARENA_BASE_URL`; bot menambahkan `/chat/completions`.

## Pengembangan

```bash
npm run check
npm test
```

### Troubleshooting

- **Missing Permissions / Missing Access:** naikkan posisi role bot dan periksa permission bot pada server/category.
- **Slash command belum terlihat:** isi `DISCORD_GUILD_ID`, lalu jalankan ulang `npm run deploy`.
- **401/403 dari AI:** periksa API key dan hak akses model.
- **404 dari AI:** base URL biasanya harus berakhir dengan `/v1`.
- **Unknown model:** isi `LMARENA_MODEL` dengan ID model persis dari provider.
- **Bot tidak membalas mention:** aktifkan Message Content Intent atau gunakan `/ai chat`.
