import json
import os
import zipfile
import io
import requests
from github import Github, GithubException
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CallbackContext

# Inisialisasi GitHub
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
BOT_TOKEN = os.getenv("BOT_TOKEN")

g = Github(GITHUB_TOKEN)
user = g.get_user()

# URL API Telegram
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_message(chat_id, text, reply_markup=None, parse_mode="Markdown"):
    """Kirim pesan ke Telegram"""
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    
    requests.post(f"{TELEGRAM_API}/sendMessage", json=data)

def edit_message(chat_id, message_id, text, reply_markup=None, parse_mode="Markdown"):
    """Edit pesan yang sudah ada"""
    data = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    
    requests.post(f"{TELEGRAM_API}/editMessageText", json=data)

def answer_callback(callback_id, text=None):
    """Jawab callback query"""
    data = {"callback_query_id": callback_id}
    if text:
        data["text"] = text
    requests.post(f"{TELEGRAM_API}/answerCallbackQuery", json=data)

def get_file_url(file_id):
    """Dapatkan URL file dari Telegram"""
    response = requests.get(f"{TELEGRAM_API}/getFile", params={"file_id": file_id})
    if response.status_code == 200:
        file_path = response.json()["result"]["file_path"]
        return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
    return None

def main_menu():
    """Menu utama inline keyboard"""
    return {
        "inline_keyboard": [
            [{"text": "📁 List Repository", "callback_data": "list"}],
            [{"text": "✨ Buat Repository", "callback_data": "create"}],
            [{"text": "🗑️ Hapus Repository", "callback_data": "delete"}],
            [{"text": "📤 Upload ke Repo", "callback_data": "upload"}],
            [{"text": "🔄 Update Repository", "callback_data": "update"}],
            [{"text": "❓ Bantuan", "callback_data": "help"}]
        ]
    }

def handle_start(chat_id):
    """Handler untuk /start"""
    send_message(
        chat_id,
        "🤖 *Bot Manajemen GitHub*\n\n"
        "Saya bisa bantu kamu mengelola repository GitHub!\n\n"
        "✅ Buat repository\n"
        "✅ Hapus repository\n"
        "✅ Lihat semua repo\n"
        "✅ Upload ZIP (auto extract)\n"
        "✅ Update file di repo yang sudah ada\n\n"
        "Klik menu di bawah untuk mulai:",
        reply_markup=main_menu()
    )

def handle_list_repos(chat_id, message_id, callback_id):
    """Handler untuk list repository"""
    answer_callback(callback_id)
    
    try:
        repos = user.get_repos()
        repo_list = []
        
        for repo in repos:
            repo_list.append(f"📌 *{repo.name}*\n🔗 {repo.html_url}\n⭐ {repo.stargazers_count} stars\n")
        
        if not repo_list:
            text = "❌ Tidak ada repository ditemukan."
        else:
            text = "*📁 Daftar Repository:*\n\n" + "\n".join(repo_list[:15])
        
        edit_message(chat_id, message_id, text, reply_markup=main_menu())
        
    except Exception as e:
        edit_message(chat_id, message_id, f"❌ Error: {str(e)}", reply_markup=main_menu())

def handle_create_repo(chat_id, message_id, callback_id, user_data):
    """Mulai proses create repository"""
    answer_callback(callback_id)
    user_data['action'] = 'waiting_repo_name'
    edit_message(
        chat_id, 
        message_id,
        "✏️ *Masukkan nama repository:*\n\nContoh: `proyek-keren-saya`\n\n"
        "(Gunakan huruf kecil, angka, dan tanda hubung saja)\n\n"
        "Balas pesan ini dengan nama repository:",
        parse_mode="Markdown"
    )

def process_create_repo(chat_id, repo_name, user_data):
    """Proses pembuatan repository"""
    repo_name = repo_name.strip().replace(" ", "-").lower()
    
    try:
        repo = user.create_repo(
            name=repo_name,
            description="Dibuat oleh Telegram Bot",
            private=False,
            auto_init=False
        )
        
        send_message(
            chat_id,
            f"✅ *Repository berhasil dibuat!*\n\n"
            f"📦 Nama: {repo.name}\n"
            f"🔗 URL: {repo.html_url}",
            reply_markup=main_menu()
        )
    except GithubException as e:
        send_message(chat_id, f"❌ Gagal: {e.data.get('message', str(e))}", reply_markup=main_menu())
    
    user_data['action'] = None

def handle_delete_repo(chat_id, message_id, callback_id, user_data):
    """Mulai proses delete repository"""
    answer_callback(callback_id)
    
    keyboard = {"inline_keyboard": []}
    repos = user.get_repos()
    
    for repo in repos:
        keyboard["inline_keyboard"].append(
            [{"text": f"🗑️ {repo.name}", "callback_data": f"del_{repo.name}"}]
        )
    
    keyboard["inline_keyboard"].append([{"text": "🔙 Kembali", "callback_data": "back"}])
    
    edit_message(
        chat_id,
        message_id,
        "⚠️ *Pilih repository yang akan dihapus*\n\nPERINGATAN: Tindakan ini TIDAK BISA dibatalkan!",
        reply_markup=keyboard
    )

def confirm_delete_repo(chat_id, message_id, callback_id, repo_name):
    """Konfirmasi dan hapus repository"""
    answer_callback(callback_id)
    
    try:
        repo = user.get_repo(repo_name)
        repo.delete()
        edit_message(
            chat_id,
            message_id,
            f"✅ *Repository {repo_name} berhasil dihapus!*",
            reply_markup=main_menu()
        )
    except Exception as e:
        edit_message(chat_id, message_id, f"❌ Gagal: {str(e)}", reply_markup=main_menu())

def handle_upload_start(chat_id, message_id, callback_id, user_data):
    """Mulai proses upload ZIP"""
    answer_callback(callback_id)
    user_data['action'] = 'waiting_zip_file'
    edit_message(
        chat_id,
        message_id,
        "📤 *Upload ke Repository*\n\n"
        "Langkah:\n"
        "1. Kirim file ZIP\n"
        "2. Nanti saya akan minta nama target repository\n"
        "3. ZIP akan diekstrak otomatis\n\n"
        "📌 *Catatan:* Repository harus sudah dibuat!\n\n"
        "Kirim file ZIP sekarang:",
        parse_mode="Markdown"
    )

def handle_zip_received(chat_id, file_id, user_data):
    """Menerima file ZIP"""
    user_data['zip_file_id'] = file_id
    user_data['action'] = 'waiting_repo_name_for_upload'
    send_message(
        chat_id,
        "✏️ *Masukkan nama target repository:*\n\nContoh: `repo-saya`\n\nRepository harus sudah dibuat sebelumnya!",
        parse_mode="Markdown"
    )

def process_upload(chat_id, repo_name, user_data):
    """Proses upload ZIP ke GitHub"""
    repo_name = repo_name.strip().replace(" ", "-").lower()
    file_id = user_data.get('zip_file_id')
    
    send_message(chat_id, f"📥 *Memproses upload ke {repo_name}...*\n⏳ Mohon tunggu...", parse_mode="Markdown")
    
    try:
        # Download file dari Telegram
        file_url = get_file_url(file_id)
        if not file_url:
            send_message(chat_id, "❌ Gagal download file", reply_markup=main_menu())
            return
        
        response = requests.get(file_url)
        file_bytes = response.content
        
        # Buka ZIP
        with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as zip_ref:
            file_list = [f for f in zip_ref.namelist() if not f.endswith('/')]
            repo = user.get_repo(repo_name)
            
            success = 0
            failed = 0
            
            for file_path in file_list:
                try:
                    file_content = zip_ref.read(file_path)
                    
                    try:
                        contents = repo.get_contents(file_path)
                        repo.update_file(
                            file_path,
                            f"Update {file_path} via Bot",
                            file_content,
                            contents.sha,
                            branch="main"
                        )
                    except GithubException:
                        repo.create_file(
                            file_path,
                            f"Add {file_path} via Bot",
                            file_content,
                            branch="main"
                        )
                    
                    success += 1
                    
                except Exception as e:
                    failed += 1
            
            send_message(
                chat_id,
                f"✅ *Upload selesai!*\n\n"
                f"📁 Repository: {repo_name}\n"
                f"✅ Berhasil: {success} file\n"
                f"❌ Gagal: {failed} file\n\n"
                f"🔗 https://github.com/{GITHUB_USERNAME}/{repo_name}",
                parse_mode="Markdown",
                reply_markup=main_menu()
            )
            
    except GithubException as e:
        if e.status == 404:
            send_message(
                chat_id,
                f"❌ Repository '{repo_name}' tidak ditemukan!\n\n"
                f"Pastikan repository sudah dibuat sebelumnya.",
                reply_markup=main_menu()
            )
        else:
            send_message(chat_id, f"❌ Error: {str(e)}", reply_markup=main_menu())
    except Exception as e:
        send_message(chat_id, f"❌ Error: {str(e)}", reply_markup=main_menu())
    
    user_data['action'] = None

def handle_update_start(chat_id, message_id, callback_id, user_data):
    """Mulai proses update repository"""
    answer_callback(callback_id)
    
    keyboard = {"inline_keyboard": []}
    repos = user.get_repos()
    
    for repo in repos:
        keyboard["inline_keyboard"].append(
            [{"text": f"📂 {repo.name}", "callback_data": f"upd_{repo.name}"}]
        )
    
    keyboard["inline_keyboard"].append([{"text": "🔙 Kembali", "callback_data": "back"}])
    
    edit_message(
        chat_id,
        message_id,
        "🔄 *Pilih repository yang akan diUPDATE:*\n\nFile yang sama akan di-overwrite!",
        reply_markup=keyboard
    )

def handle_update_repo(chat_id, message_id, callback_id, repo_name, user_data):
    """Pilih repository untuk diupdate"""
    answer_callback(callback_id)
    user_data['update_repo'] = repo_name
    user_data['action'] = 'waiting_update_zip'
    edit_message(
        chat_id,
        message_id,
        f"📤 *Kirim file ZIP untuk update repository '{repo_name}'*\n\n"
        "File ZIP akan diekstrak dan mengupdate file yang ada (overwrite):",
        parse_mode="Markdown"
    )

def process_update(chat_id, file_id, user_data):
    """Proses update ZIP ke GitHub"""
    repo_name = user_data.get('update_repo')
    
    send_message(chat_id, f"🔄 *Mengupdate {repo_name}...*\n⏳ Mohon tunggu...", parse_mode="Markdown")
    
    try:
        file_url = get_file_url(file_id)
        if not file_url:
            send_message(chat_id, "❌ Gagal download file", reply_markup=main_menu())
            return
        
        response = requests.get(file_url)
        file_bytes = response.content
        
        with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as zip_ref:
            repo = user.get_repo(repo_name)
            success = 0
            failed = 0
            
            for file_path in zip_ref.namelist():
                if file_path.endswith('/'):
                    continue
                
                try:
                    file_content = zip_ref.read(file_path)
                    
                    try:
                        contents = repo.get_contents(file_path)
                        repo.update_file(
                            file_path,
                            f"Update {file_path} via Bot",
                            file_content,
                            contents.sha,
                            branch="main"
                        )
                    except GithubException as e:
                        if e.status == 404:
                            repo.create_file(
                                file_path,
                                f"Add {file_path} via Bot",
                                file_content,
                                branch="main"
                            )
                        else:
                            raise e
                    
                    success += 1
                    
                except Exception as e:
                    failed += 1
            
            send_message(
                chat_id,
                f"✅ *Update selesai!*\n\n"
                f"✅ Berhasil: {success} file\n"
                f"❌ Gagal: {failed} file\n"
                f"🔗 https://github.com/{GITHUB_USERNAME}/{repo_name}",
                parse_mode="Markdown",
                reply_markup=main_menu()
            )
            
    except Exception as e:
        send_message(chat_id, f"❌ Error: {str(e)}", reply_markup=main_menu())
    
    user_data['action'] = None

def handle_help(chat_id, message_id, callback_id):
    """Handler untuk bantuan"""
    answer_callback(callback_id)
    
    help_text = (
        "*📖 Panduan Penggunaan Bot*\n\n"
        "*1. Buat Repository*\n"
        "Masukkan nama repository (tanpa spasi, pakai tanda hubung)\n\n"
        "*2. Upload ke Repository*\n"
        "• Kirim file ZIP\n"
        "• Masukkan nama target repository\n"
        "• Bot akan ekstrak dan upload semua file\n\n"
        "*3. Update Repository*\n"
        "• Pilih repository yang akan diupdate\n"
        "• Kirim file ZIP (akan overwrite file yang sama)\n\n"
        "*4. Hapus Repository*\n"
        "⚠️ HATI-HATI! Tindakan ini tidak bisa dibatalkan!"
    )
    
    edit_message(chat_id, message_id, help_text, reply_markup=main_menu())

def handle_back(chat_id, message_id, callback_id):
    """Kembali ke menu utama"""
    answer_callback(callback_id)
    edit_message(
        chat_id,
        message_id,
        "🔙 *Kembali ke menu utama:*",
        parse_mode="Markdown",
        reply_markup=main_menu()
    )

# Dictionary untuk menyimpan state sementara (di Vercel ini akan reset setiap request)
# Untuk production, sebaiknya pakai database seperti Redis
user_sessions = {}

def handler(request, context):
    """Main handler untuk Vercel"""
    
    # Handle POST request dari webhook Telegram
    if request.method == "POST":
        body = request.get_json()
        
        # Handle callback query (tombol inline)
        if "callback_query" in body:
            callback = body["callback_query"]
            chat_id = callback["message"]["chat"]["id"]
            message_id = callback["message"]["message_id"]
            callback_id = callback["id"]
            data = callback["data"]
            
            if data == "list":
                handle_list_repos(chat_id, message_id, callback_id)
            elif data == "create":
                handle_create_repo(chat_id, message_id, callback_id, user_sessions.get(chat_id, {}))
            elif data == "delete":
                handle_delete_repo(chat_id, message_id, callback_id, user_sessions.get(chat_id, {}))
            elif data == "upload":
                handle_upload_start(chat_id, message_id, callback_id, user_sessions.get(chat_id, {}))
            elif data == "update":
                handle_update_start(chat_id, message_id, callback_id, user_sessions.get(chat_id, {}))
            elif data == "help":
                handle_help(chat_id, message_id, callback_id)
            elif data == "back":
                handle_back(chat_id, message_id, callback_id)
            elif data.startswith("del_"):
                repo_name = data[4:]
                confirm_delete_repo(chat_id, message_id, callback_id, repo_name)
            elif data.startswith("upd_"):
                repo_name = data[4:]
                handle_update_repo(chat_id, message_id, callback_id, repo_name, user_sessions.get(chat_id, {}))
        
        # Handle pesan biasa (teks atau dokumen)
        elif "message" in body:
            message = body["message"]
            chat_id = message["chat"]["id"]
            user_id = chat_id
            
            # Inisialisasi session jika belum ada
            if user_id not in user_sessions:
                user_sessions[user_id] = {}
            
            user_data = user_sessions[user_id]
            
            # Handle perintah /start
            if "text" in message and message["text"] == "/start":
                handle_start(chat_id)
            
            # Handle text untuk input nama repository
            elif "text" in message and user_data.get('action') in ['waiting_repo_name', 'waiting_repo_name_for_upload']:
                repo_name = message["text"]
                
                if user_data.get('action') == 'waiting_repo_name':
                    process_create_repo(chat_id, repo_name, user_data)
                elif user_data.get('action') == 'waiting_repo_name_for_upload':
                    process_upload(chat_id, repo_name, user_data)
            
            # Handle file ZIP
            elif "document" in message:
                file_id = message["document"]["file_id"]
                
                if user_data.get('action') == 'waiting_zip_file':
                    handle_zip_received(chat_id, file_id, user_data)
                elif user_data.get('action') == 'waiting_update_zip':
                    process_update(chat_id, file_id, user_data)
                else:
                    send_message(chat_id, "❌ Silakan pilih menu upload/update terlebih dahulu!", reply_markup=main_menu())
        
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": True})
        }
    
    # Handle GET request (testing)
    return {
        "statusCode": 200,
        "body": json.dumps({"status": "Bot is running!"})
    }
