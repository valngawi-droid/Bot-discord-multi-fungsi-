# Bot Discord Multi Fungsi + AI Gemini/LMArena

Bot Discord berbahasa Indonesia untuk:

- membuat dan menghapus **role, kategori, text/voice/announcement/forum/stage channel** melalui slash command;
- menyusun seluruh server dari **template JSON yang idempotent** (item yang sudah ada tidak dibuat ulang);
- mengatur channel private dan akses berbasis role;
- chat AI melalui **Google Gemini API** atau endpoint OpenAI-compatible/LMArena;
- percakapan AI per pengguna/per channel, reset riwayat, mention bot, dan pembatasan channel AI;
- utilitas `/clear`, `/serverinfo`, dan `/ping`.

API key hanya dibaca dari `.env`, tidak pernah ditaruh di source code atau ditampilkan oleh bot.

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

AI_PROVIDER=gemini
GEMINI_API_KEY=masukkan_key_baru_di_sini
GEMINI_MODEL=gemini-3.5-flash-lite
```

`DISCORD_GUILD_ID` direkomendasikan agar slash command muncul segera. `REGISTER_COMMANDS_ON_START=true` mendaftarkan command otomatis saat bot dinyalakan. Jika guild ID dikosongkan, command didaftarkan secara global dan propagasinya dapat memerlukan waktu.

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
| `/member ...`, `/helpmember` | 20 utilitas profil/server/random | Member, Admin, Owner |
| `/admin ...`, `/helpadmin` | 25 fitur moderasi dan channel | Admin, Owner |
| `/owner ...`, `/helpowner` | 20 kontrol bot/server | Owner |
| `/permission ...` | 8 pengaturan view/chat/voice/private/sync role | Owner |
| `/autokeamanan analisis/lihat/terapkan/batal` | AI audit dan auto-setting permission | Owner |
| `/buat-server prompt/lihat/terapkan/batal` | Buat struktur server dari prompt AI dengan preview | Owner |
| `/auto-setup` | Buat role, kategori, text/voice channel, dan akses sekaligus | Owner |
| `/akses-channel` | Izinkan/larang role melihat channel | Owner |
| `/setup-server` | Preview/apply template JSON tingkat lanjut | Owner |
| `/role`, `/category`, `/channel` | Kelola struktur Discord | Owner |
| `/ai chat/reset/status`, `/serverinfo`, `/ping` | Chat AI dan informasi | Member, Admin, Owner |
| `/clear` | Hapus 1–100 pesan terbaru | Admin, Owner |

Bot menyediakan **102 fungsi aktif** dalam 19 slash command tingkat atas. Fungsi dikelompokkan agar tidak memenuhi daftar Discord dan tetap berada di bawah batas 100 command aplikasi. Gunakan `/helpmember`, `/helpadmin`, dan `/helpowner` untuk daftar sesuai role.

Hierarki akses bersifat menurun: Owner dapat memakai semua fitur; Admin dapat memakai Admin dan Member; Member hanya fitur Member. Konfigurasikan ID role:

```env
OWNER_ROLE_ID=1537795490262028349
ADMIN_ROLE_ID=1537795491847340096
MEMBER_ROLE_ID=1537795510772039870
```

Command penghapusan meminta kata `HAPUS`. Penghapusan kategori hanya diizinkan jika kategori kosong. `/setup-server` bersifat **non-destruktif**: hanya membuat yang belum ada dan tidak menghapus atau menimpa item lama.

### Auto Keamanan AI

Owner dapat meminta AI membaca struktur server dan membuat rencana permission otomatis:

```text
/autokeamanan analisis mode:Aman
```

Untuk menganalisis hanya satu kategori:

```text
/autokeamanan analisis kategori:INFORMATION & RULES mode:Ketat
```

Bot menampilkan preview dan file `rencana-keamanan.json`. AI tidak langsung mengubah server. Setelah diperiksa:

```text
/autokeamanan terapkan konfirmasi:APPLY
```

Gunakan `/autokeamanan lihat` untuk membuka rencana terakhir atau `/autokeamanan batal` untuk membatalkan. Rencana berlaku 30 menit. Semua channel ID, role ID, dan permission keluaran AI divalidasi terhadap server dan whitelist sebelum dapat diterapkan.

### Permission role/category/channel

Owner dapat mengatur akses secara rinci:

```text
/permission view channel:#staff-chat role:@Moderator mode:Izinkan
/permission chat channel:#pengumuman role:@Member mode:Larang
/permission voice channel:Lounge role:@Member mode:Izinkan
/permission private channel:#owner-only role:@Owner
/permission readonly channel:#peraturan role:@Member
/permission sync-category channel:#staff-chat
/permission inspect channel:#staff-chat
```

### Log webhook dan status online

Hapus webhook yang pernah dibagikan ke chat dan buat webhook baru. Simpan URL baru hanya di `.env`:

```env
LOG_WEBHOOK_URL=https://discord.com/api/webhooks/ID/TOKEN_BARU
ONLINE_CATEGORY_ID=1537796852995461281
ONLINE_CHANNEL_NAME=bot-status
ONLINE_MENTION_EVERYONE=true
```

Saat startup, bot membuat/memakai `#bot-status` di kategori tersebut, mengirim status online, dan mention `@everyone`. Webhook menerima audit aman: startup, command, setup/moderasi, dan error tanpa isi pesan, prompt, token, atau API key.

### Website untuk prompt panjang (Termux)

Dashboard web berjalan bersama bot dan menerima prompt hingga 50.000 karakter. Tambahkan ke `.env`:

```env
DASHBOARD_ENABLED=true
DASHBOARD_HOST=127.0.0.1
DASHBOARD_PORT=3000
DASHBOARD_TOKEN=
```

Jalankan `npm start`, lalu buka alamat berikut di browser pada Android yang sama:

```text
http://127.0.0.1:3000
```

Paste prompt panjang, tekan **Buat Preview**, periksa tindakan dan JSON, ketik `APPLY`, lalu tekan **Terapkan Sekarang**. Rencana berlaku 30 menit. Dashboard hanya mengelola server pada `DISCORD_GUILD_ID`.

`127.0.0.1` membuat dashboard hanya dapat diakses dari perangkat sendiri. Jangan menggantinya dengan `0.0.0.0` atau membuka port ke internet. Untuk perlindungan tambahan, isi `DASHBOARD_TOKEN` dengan string rahasia; website kemudian menampilkan kolom token.

### Membuat server lewat prompt AI di Discord

Untuk prompt maksimal 2.000 karakter, tulis struktur yang Anda inginkan dengan bahasa biasa:

```text
/buat-server prompt deskripsi:Buat server gaming. Buat role Admin merah, Moderator oranye, dan Member biru. Buat kategori INFORMASI berisi peraturan dan pengumuman yang hanya dapat dikirim Admin. Buat kategori KOMUNITAS berisi umum, bot-command, dan voice Ngobrol. Buat kategori STAFF private yang hanya bisa dilihat Admin dan Moderator, berisi staff-chat dan Staff Voice.
```

Bot hanya membuat **rencana dan preview** terlebih dahulu. File `rencana-server.json` dilampirkan agar dapat diperiksa. Terapkan setelah benar:

```text
/buat-server terapkan konfirmasi:APPLY
```

Rencana berlaku 30 menit dan terikat pada admin yang membuatnya. Gunakan `/buat-server lihat` untuk melihat ulang atau `/buat-server batal` untuk membatalkan. Output AI selalu divalidasi sebelum dapat diterapkan; AI tidak langsung mengubah server dari tahap prompt.

### Auto setup langsung dari Discord tanpa AI

Contoh membuat kategori publik beserta channel:

```text
/auto-setup kategori:KOMUNITAS akses:semua text_channels:umum,bot-command voice_channels:Ngobrol roles:Member
```

Contoh kategori staff yang hanya terlihat oleh role tertentu:

```text
/auto-setup kategori:STAFF akses:Admin,Moderator text_channels:staff-chat,laporan voice_channels:Staff Voice roles:Admin,Moderator
```

Role yang belum ada otomatis dibuat. Pisahkan beberapa role atau channel dengan koma. Command aman dijalankan ulang: item bernama sama akan dilewati. Untuk mengubah akses setelahnya:

```text
/akses-channel channel:#staff-chat role:@Member bisa_melihat:Tidak
```

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

### Google Gemini (disarankan)

Buat key baru di Google AI Studio, lalu masukkan langsung ke `.env`—jangan kirim melalui chat:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=key_baru_anda
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite,gemini-2.5-flash
AI_MAX_RETRIES=3
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### OpenAI-compatible/LMArena

```env
AI_PROVIDER=openai-compatible
LMARENA_BASE_URL=https://endpoint-provider-anda.example/v1
LMARENA_API_KEY=key_provider
LMARENA_MODEL=nama-model-persis
```

Bot menambahkan `/chat/completions` pada base URL OpenAI-compatible.

Pengaturan umum:

- `AI_CHANNEL_IDS`: ID channel dipisahkan koma; kosong berarti semua channel.
- `AI_REPLY_ON_MENTION=false`: gunakan hanya slash command tanpa privileged Message Content Intent (nilai default dan disarankan).
- `AI_REPLY_ON_MENTION=true`: aktifkan respons mention; wajib mengaktifkan **Message Content Intent** di Discord Developer Portal.
- `AI_SYSTEM_PROMPT`: karakter/instruksi bot.
- `AI_MAX_TOKENS`, `AI_TEMPERATURE`, `AI_TIMEOUT_MS`: kontrol request.

Riwayat hanya disimpan di memori (maksimal 12 pesan per pengguna/channel) dan hilang saat bot restart. Bot tidak mencetak API key ke log. `/ai status` hanya menunjukkan apakah key sudah terisi.

## Instalasi di Android lewat Termux

Gunakan Termux versi yang masih menerima pembaruan. Di Termux, jalankan:

```bash
pkg update -y
pkg install -y git
termux-setup-storage
cd ~
git clone https://github.com/valngawi-droid/Bot-discord-multi-fungsi-.git
cd Bot-discord-multi-fungsi-
bash scripts/install-termux.sh
```

Installer memasang Node.js LTS, Git, Nano, tmux, dependency npm, dan membuat `.env` tanpa menimpa konfigurasi lama. Setelah selesai:

```bash
nano .env
npm run deploy
npm start
```

Di Nano, simpan dengan `Ctrl+O`, Enter, lalu keluar dengan `Ctrl+X`.

### Menjalankan bot terus di Termux

Android dapat menghentikan Termux ketika aplikasi masuk latar belakang. Nonaktifkan optimasi baterai untuk Termux pada pengaturan Android, lalu gunakan wake lock dan tmux:

```bash
termux-wake-lock
tmux new -s discordbot
bash scripts/start-termux.sh
```

- Lepas dari tmux tanpa menghentikan bot: tekan `Ctrl+B`, lepaskan, lalu tekan `D`.
- Buka kembali sesi bot: `tmux attach -t discordbot`.
- Hentikan bot: masuk ke sesi tmux lalu tekan `Ctrl+C`.
- Lepaskan wake lock setelah bot dihentikan: `termux-wake-unlock`.

Setelah source code diperbarui:

```bash
cd ~/Bot-discord-multi-fungsi-
git pull
npm ci
npm run deploy
```

Token dan API key tetap hanya berada di `.env`. Jangan mengirim isi file tersebut ke Discord atau GitHub. Menjalankan bot 24/7 dari Android bergantung pada koneksi dan kebijakan baterai perangkat; VPS lebih stabil untuk penggunaan produksi.

## Pengembangan

```bash
npm run check
npm test
```

### Troubleshooting

- **Missing Permissions / Missing Access:** naikkan posisi role bot dan periksa permission bot pada server/category.
- **Slash command belum terlihat:** isi `DISCORD_GUILD_ID`, set `REGISTER_COMMANDS_ON_START=true`, pastikan bot diundang dengan scope `bot applications.commands`, lalu restart. Terminal harus menampilkan `19 slash command terdaftar otomatis` (berisi 102 fungsi/subcommand).
- **401/403 dari AI:** revoke key yang pernah dibagikan, buat key baru, lalu periksa hak akses API/model.
- **503/high demand dari Gemini:** gunakan `gemini-3.5-flash-lite`; bot otomatis mencoba ulang dan berpindah ke `GEMINI_FALLBACK_MODELS`.
- **Invalid Form Body / channel type:** announcement channel membutuhkan Community Server. Bot otomatis membuat text channel sebagai pengganti jika Community belum aktif.
- **404 dari Gemini:** biarkan `GEMINI_BASE_URL` memakai nilai default dan periksa `GEMINI_MODEL`.
- **404 dari OpenAI-compatible:** base URL biasanya harus berakhir dengan `/v1`.
- **Unknown model:** periksa `GEMINI_MODEL` atau `LMARENA_MODEL` sesuai provider.
- **Used disallowed intents:** set `AI_REPLY_ON_MENTION=false`; atau aktifkan Message Content Intent di Developer Portal jika memang membutuhkan respons mention.
- **Bot tidak membalas mention:** aktifkan Message Content Intent dan set `AI_REPLY_ON_MENTION=true`, atau gunakan `/ai chat` tanpa privileged intent.
- **Token terlihat di screenshot/chat:** segera gunakan **Reset Token** di Developer Portal dan revoke API key terkait. Jangan gunakan kembali credential lama.
