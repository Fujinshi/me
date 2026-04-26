import json
import os
import requests
from http.server import BaseHTTPRequestHandler

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "")

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_message(chat_id, text):
    url = f"{TELEGRAM_API}/sendMessage"
    data = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    try:
        requests.post(url, json=data)
    except Exception as e:
        print(f"Error sending message: {e}")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "Bot is running!",
            "bot_token_set": bool(BOT_TOKEN),
            "github_token_set": bool(GITHUB_TOKEN),
            "github_username": GITHUB_USERNAME
        }).encode())
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            
            # Handle message
            if "message" in body:
                msg = body["message"]
                chat_id = msg["chat"]["id"]
                
                if "text" in msg and msg["text"] == "/start":
                    send_message(chat_id, "🤖 Bot is alive!\n\nEnvironment variables:\n" +
                                 f"- BOT_TOKEN: {'✅' if BOT_TOKEN else '❌'}\n" +
                                 f"- GITHUB_TOKEN: {'✅' if GITHUB_TOKEN else '❌'}\n" +
                                 f"- GITHUB_USERNAME: {GITHUB_USERNAME or '❌'}")
                else:
                    send_message(chat_id, "Use /start to begin")
            
            # Handle callback query
            elif "callback_query" in body:
                callback = body["callback_query"]
                chat_id = callback["message"]["chat"]["id"]
                send_message(chat_id, "Feature coming soon!")
                
        except Exception as e:
            print(f"Error processing update: {e}")
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True}).encode())
