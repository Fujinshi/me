import { Telegraf, session } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

const bot = new Telegraf(TOKEN);
const app = express();

// Session middleware
bot.use(session());
bot.use(async (ctx, next) => {
  ctx.github = {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    }
  };
  await next();
});

// Menu utama
const mainMenu = () => ({
  reply_markup: {
    inline_keyboard: [
      [{ text: '📁 List Repositories', callback_data: 'list_repos' }],
      [{ text: '✨ Create Repository', callback_data: 'create_repo' }],
      [{ text: '🗑️ Delete Repository', callback_data: 'delete_repo' }],
      [{ text: '📤 Upload to Repository', callback_data: 'upload_repo' }],
      [{ text: '🔄 Update Repository', callback_data: 'update_repo' }],
      [{ text: 'ℹ️ Help', callback_data: 'help' }]
    ]
  }
});

// Start command
bot.start(async (ctx) => {
  await ctx.reply(
    '🤖 *GitHub Management Bot*\n\n' +
    'Saya dapat membantu Anda mengelola repository GitHub!\n\n' +
    '📌 *Fitur:*\n' +
    '• Create repository\n' +
    '• Delete repository\n' +
    '• List semua repository\n' +
    '• Upload file ke repository kosong\n' +
    '• Update file di repository yang sudah ada\n' +
    '• Upload ZIP dan extract otomatis\n\n' +
    'Gunakan menu di bawah untuk memulai:',
    { parse_mode: 'Markdown', ...mainMenu() }
  );
});

// List repositories
bot.action('list_repos', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📡 *Mengambil daftar repository...*', { parse_mode: 'Markdown' });
  
  try {
    const response = await axios.get(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos`,
      { headers: ctx.github.headers }
    );
    
    const repos = response.data;
    if (repos.length === 0) {
      await ctx.reply('❌ Tidak ada repository ditemukan.');
      return;
    }
    
    let message = '*📁 Daftar Repository:*\n\n';
    repos.forEach((repo, index) => {
      message += `${index + 1}. *${repo.name}*\n`;
      message += `   🔗 ${repo.html_url}\n`;
      message += `   📝 ${repo.description || 'Tidak ada deskripsi'}\n`;
      message += `   ⭐ ${repo.stargazers_count} stars\n\n`;
    });
    
    await ctx.reply(message, { parse_mode: 'Markdown', ...mainMenu() });
  } catch (error) {
    await ctx.reply(`❌ Error: ${error.response?.data?.message || error.message}`, mainMenu());
  }
});

// Create repository
bot.action('create_repo', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.action = 'waiting_repo_name';
  await ctx.reply('✏️ *Masukkan nama repository:*\n\nContoh: `my-awesome-project`', {
    parse_mode: 'Markdown',
    reply_markup: { force_reply: true }
  });
});

// Delete repository
bot.action('delete_repo', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.action = 'waiting_delete_repo';
  
  try {
    const response = await axios.get(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos`,
      { headers: ctx.github.headers }
    );
    
    const repos = response.data;
    if (repos.length === 0) {
      await ctx.reply('❌ Tidak ada repository untuk dihapus.', mainMenu());
      return;
    }
    
    const buttons = repos.map(repo => [
      { text: `🗑️ ${repo.name}`, callback_data: `confirm_delete_${repo.name}` }
    ]);
    buttons.push([{ text: '🔙 Kembali ke Menu', callback_data: 'back_to_menu' }]);
    
    await ctx.reply('🗑️ *Pilih repository yang akan dihapus:*', {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (error) {
    await ctx.reply(`❌ Error: ${error.response?.data?.message || error.message}`, mainMenu());
  }
});

// Handle delete confirmation
bot.action(/confirm_delete_(.+)/, async (ctx) => {
  const repoName = ctx.match[1];
  await ctx.answerCbQuery();
  
  try {
    await axios.delete(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}`,
      { headers: ctx.github.headers }
    );
    
    await ctx.reply(`✅ *Repository "${repoName}" berhasil dihapus!*`, {
      parse_mode: 'Markdown',
      ...mainMenu()
    });
  } catch (error) {
    await ctx.reply(`❌ Gagal menghapus: ${error.response?.data?.message || error.message}`, mainMenu());
  }
});

// Upload repository
bot.action('upload_repo', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.action = 'waiting_upload_file';
  await ctx.reply('📤 *Kirim file ZIP yang akan diupload ke repository kosong*\n\n' +
    'Pastikan:\n' +
    '• File dalam format ZIP\n' +
    '• Repository sudah dibuat sebelumnya\n' +
    '• Repository masih kosong\n\n' +
    'Kirim file ZIP sekarang:', {
    parse_mode: 'Markdown'
  });
});

// Update repository
bot.action('update_repo', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.action = 'waiting_update_repo';
  
  try {
    const response = await axios.get(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos`,
      { headers: ctx.github.headers }
    );
    
    const repos = response.data;
    const buttons = repos.map(repo => [
      { text: `📂 ${repo.name}`, callback_data: `select_update_repo_${repo.name}` }
    ]);
    buttons.push([{ text: '🔙 Kembali', callback_data: 'back_to_menu' }]);
    
    await ctx.reply('🔄 *Pilih repository yang akan diupdate:*', {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (error) {
    await ctx.reply(`❌ Error: ${error.response?.data?.message || error.message}`, mainMenu());
  }
});

bot.action(/select_update_repo_(.+)/, async (ctx) => {
  const repoName = ctx.match[1];
  ctx.session.updateRepo = repoName;
  ctx.session.action = 'waiting_update_file';
  await ctx.answerCbQuery();
  await ctx.reply(`📤 *Kirim file ZIP untuk update repository "${repoName}"*\n\n` +
    'File ZIP akan diekstrak dan mengupdate file yang ada (akan overwrite):',
    { parse_mode: 'Markdown' }
  );
});

// Handle text input for repo name
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  if (ctx.session.action === 'waiting_repo_name') {
    const repoName = text.trim().replace(/\s+/g, '-').toLowerCase();
    
    try {
      await ctx.reply(`🚀 *Membuat repository "${repoName}"...*`, { parse_mode: 'Markdown' });
      
      const response = await axios.post(
        'https://api.github.com/user/repos',
        {
          name: repoName,
          description: 'Created by Telegram Bot',
          private: false,
          auto_init: false
        },
        { headers: ctx.github.headers }
      );
      
      await ctx.reply(`✅ *Repository "${repoName}" berhasil dibuat!*\n\n🔗 ${response.data.html_url}`, {
        parse_mode: 'Markdown',
        ...mainMenu()
      });
    } catch (error) {
      await ctx.reply(`❌ Gagal membuat repository: ${error.response?.data?.message || error.message}`, mainMenu());
    }
    
    ctx.session.action = null;
  } else {
    await ctx.reply('🔙 Kembali ke menu utama:', mainMenu());
  }
});

// Handle file upload
bot.on('document', async (ctx) => {
  const file = ctx.message.document;
  
  if (!file.file_name.endsWith('.zip')) {
    await ctx.reply('❌ Harap kirim file ZIP!', mainMenu());
    return;
  }
  
  if (ctx.session.action === 'waiting_upload_file' || ctx.session.action === 'waiting_update_file') {
    try {
      await ctx.reply('📥 *Mendownload dan memproses file ZIP...*', { parse_mode: 'Markdown' });
      
      // Download file
      const fileLink = await ctx.telegram.getFileLink(file.file_id);
      const zipResponse = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      
      // Extract ZIP
      const zip = new AdmZip(zipResponse.data);
      const entries = zip.getEntries();
      
      let repoName;
      if (ctx.session.action === 'waiting_update_file') {
        repoName = ctx.session.updateRepo;
      } else {
        await ctx.reply('✏️ *Masukkan nama target repository:*', {
          parse_mode: 'Markdown',
          reply_markup: { force_reply: true }
        });
        
        const repoResponse = await new Promise(resolve => {
          bot.once('text', async (ctx) => {
            resolve(ctx.message.text.trim().replace(/\s+/g, '-').toLowerCase());
          });
        });
        
        repoName = repoResponse;
      }
      
      await ctx.reply(`🚀 *Mengupload ke repository "${repoName}"...*`, { parse_mode: 'Markdown' });
      
      // Upload each file
      let successCount = 0;
      let failCount = 0;
      
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        
        const filePath = entry.entryName;
        const content = entry.getData().toString('base64');
        
        try {
          // Check if file exists
          let sha = null;
          try {
            const checkResponse = await axios.get(
              `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/${filePath}`,
              { headers: ctx.github.headers }
            );
            sha = checkResponse.data.sha;
          } catch (err) {
            // File doesn't exist, will create new
          }
          
          // Create or update file
          await axios.put(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/${filePath}`,
            {
              message: sha ? `Update ${filePath}` : `Add ${filePath}`,
              content: content,
              sha: sha,
              branch: 'main'
            },
            { headers: ctx.github.headers }
          );
          
          successCount++;
          await ctx.reply(`✅ Uploaded: ${filePath}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to upload ${filePath}:`, error.response?.data?.message || error.message);
        }
      }
      
      await ctx.reply(
        `✅ *Upload selesai!*\n\n` +
        `📁 Repository: ${repoName}\n` +
        `✅ Berhasil: ${successCount} file\n` +
        `❌ Gagal: ${failCount} file\n\n` +
        `🔗 https://github.com/${GITHUB_USERNAME}/${repoName}`,
        { parse_mode: 'Markdown', ...mainMenu() }
      );
      
      ctx.session.action = null;
      ctx.session.updateRepo = null;
      
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`, mainMenu());
      ctx.session.action = null;
    }
  } else {
    await ctx.reply('❌ Silakan pilih menu upload terlebih dahulu!', mainMenu());
  }
});

// Help
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    '*📖 Panduan Penggunaan Bot*\n\n' +
    '*1. Create Repository*\n' +
    'Masukkan nama repository (tanpa spasi)\n\n' +
    '*2. Upload ke Repository Kosong*\n' +
    '• Kirim file ZIP\n' +
    '• Masukkan nama target repository\n' +
    '• Bot akan ekstrak dan upload semua file\n\n' +
    '*3. Update Repository*\n' +
    '• Pilih repository yang akan diupdate\n' +
    '• Kirim file ZIP\n' +
    '• File akan overwrite yang sudah ada\n\n' +
    '*4. Delete Repository*\n' +
    '⚠️ HATI-HATI! Tindakan ini tidak bisa dibatalkan\n\n' +
    '*Format ZIP:*\n' +
    'Bot akan mempertahankan struktur folder dari ZIP\n\n' +
    '📌 *Tips:*\n' +
    '• Nama repository hanya boleh huruf kecil, angka, dan tanda hubung\n' +
    '• File maksimal 100MB per file\n' +
    '• ZIP akan diekstrak otomatis',
    { parse_mode: 'Markdown', ...mainMenu() }
  );
});

bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🔙 *Kembali ke menu utama:*', { parse_mode: 'Markdown', ...mainMenu() });
});

// Webhook untuk Vercel
app.use(express.json());
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Start webhook untuk Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start polling jika lokal
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
  console.log('Bot started in polling mode');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
