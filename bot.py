# -*- coding: utf-8 -*-
"""
Al-Khorazmiy International School - Rasmiy Telegram Bot
------------------------------------------------------
Vazifalari:
1. Saytdan yoki havoladan kelgan foydalanuvchini qabul qilish.
2. Foydalanuvchidan telefon raqamini (tugma yoki matn orqali) qabul qilish.
3. Telefon raqam kelishi bilan:
   - Foydalanuvchini BOTNING O'ZIDA ADMINISTRATOR (Admin) qilish.
   - Foydalanuvchiga to'liq Admin Panel (Statistika, Arizalar, Yangi 1 martalik link, Kanalga e'lon) berish.
   - Foydalanuvchi uchun @AlKhorazmiy_registration kanaliga 1 kishilik maxsus havola (member_limit=1) berish.
   - Kanalda ham Administrator huquqini taqdim etish.
   - Rasmiy kanalga yangi admin haqida hisobot yuborish.
"""

import os
import sys
import re
import json
import time
import logging
from datetime import datetime

# Windows console encoding fix
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import urllib.request
import telebot
from telebot import types
import threading
import secrets
import html
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

# Load .env file automatically (zero external dependencies)
ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as _ef:
            for _line in _ef:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
    except Exception:
        pass

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8970878526:AAFP_eJB79VatZuhg5rkyE3t7yrzL3Uw_44")
TARGET_CHAT_ID = int(os.environ.get("TELEGRAM_CHAT_ID", "-1004255969278"))  # @AlKhorazmiy_registration
OWNER_ID = os.environ.get("OWNER_TELEGRAM_ID", "6599495111")                 # Asadbek Mamatov

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lzthytpezdadtobbampc.supabase.co").rstrip("/")
SUPABASE_PUB_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp")
BOT_SYNC_KEY = os.environ.get("BOT_SYNC_KEY", "")
BOT_SYNC_URL = f"{SUPABASE_URL}/functions/v1/bot-sync"
SUBMIT_APP_URL = f"{SUPABASE_URL}/functions/v1/submit-application"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")

DATA_FILE = os.path.join(os.path.dirname(__file__), "bot_data.json")

def load_data():
    default_data = {
        "verified_users": {
            OWNER_ID: {
                "phone": "+998",
                "name": "Asadbek Mamatov",
                "username": "@asadbek21mamatov",
                "token": "creator",
                "registered_at": "02.10.2026 16:10:00",
                "role": "Super Admin"
            }
        },
        "used_tokens": [],
        "pending_tokens": {},
        "admins": [OWNER_ID]
    }
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if OWNER_ID not in data.get("admins", []):
                    data.setdefault("admins", []).append(OWNER_ID)
                return data
        except Exception as e:
            logger.error(f"Fayl o'qishda xatolik: {e}")
    return default_data

def save_data(data):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Fayl saqlashda xatolik: {e}")

db = load_data()
recent_cloud_apps = []


def _call_bot_sync(payload: dict, timeout: int = 8):
    """Supabase bot-sync Edge Function bilan xavfsiz bog'lanish"""
    if not BOT_SYNC_KEY:
        return None
    try:
        req = urllib.request.Request(
            BOT_SYNC_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-bot-sync-key": BOT_SYNC_KEY,
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        logger.warning(f"Supabase bot-sync ulanish ogohlantirishi: {e}")
        return None


def sync_from_supabase():
    """Supabase Cloud bazasidan foydalanuvchilar, tokenlar va oxirgi arizalarni sinxronlash"""
    global db, recent_cloud_apps
    res = _call_bot_sync({"action": "get_state"})
    if res and res.get("ok") and isinstance(res.get("state"), dict):
        st = res["state"]
        # Merge verified_users & admins while preserving local user_id->token pending mapping
        cloud_users = st.get("verified_users") or {}
        db.setdefault("verified_users", {}).update(cloud_users)

        for aid in st.get("admins") or []:
            if aid not in db.setdefault("admins", []):
                db["admins"].append(aid)
        if OWNER_ID not in db["admins"]:
            db["admins"].append(OWNER_ID)

        for ut in st.get("used_tokens") or []:
            if ut not in db.setdefault("used_tokens", []):
                db["used_tokens"].append(ut)

        cloud_pending = st.get("pending_tokens") or {}
        db.setdefault("pending_tokens", {}).update(cloud_pending)

        recent_cloud_apps = res.get("recent_applications") or []
        save_data(db)
        return True
    return False


def supabase_verify_user_async(telegram_id: str, full_name: str, username: str, phone: str, token_used: str):
    """Yangi tasdiqlangan admin va ishlatilgan tokenni Supabase bazasiga yozish"""
    def _worker():
        _call_bot_sync({
            "action": "verify_user",
            "telegram_id": telegram_id,
            "full_name": full_name,
            "username": username,
            "phone": phone,
            "token_used": token_used,
            "role": "Administrator",
            "is_admin": True,
        })
    threading.Thread(target=_worker, daemon=True).start()


def supabase_create_token_async(token: str, parent: str = "Telegram Admin havola"):
    """Yangi 1 martalik tokenni Supabase bazasiga yozish"""
    def _worker():
        _call_bot_sync({
            "action": "create_token",
            "token": token,
            "parent": parent,
        })
    threading.Thread(target=_worker, daemon=True).start()


# Dastur ishga tushganda Supabase bilan dastlabki sinxronlash
sync_from_supabase()


def get_admin_keyboard():
    """Adminlar uchun asosiy tugmalar paneli"""
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(
        types.KeyboardButton("📊 Statistika"),
        types.KeyboardButton("📋 Oxirgi arizalar"),
        types.KeyboardButton("🔑 Yangi 1 martalik link"),
        types.KeyboardButton("📢 Kanalga e'lon yuborish"),
        types.KeyboardButton("👑 Adminlar ro'yxati")
    )
    return markup


def setup_admin_menu(chat_id):
    """Admin foydalanuvchi Telegramida menyu buyruqlarini faollashtirish"""
    try:
        commands = [
            types.BotCommand("admin", "👑 Admin Boshqaruv Paneli"),
            types.BotCommand("stats", "📊 Tizim statistikasi"),
            types.BotCommand("users", "📋 Arizachilar ro'yxati"),
            types.BotCommand("newlink", "🔑 Yangi 1 martalik link olish"),
            types.BotCommand("broadcast", "📢 Kanalga e'lon yuborish")
        ]
        bot.set_my_commands(commands, scope=types.BotCommandScopeChat(chat_id))
    except Exception as e:
        logger.warning(f"Menyu sozlashda ogohlantirish: {e}")


def promote_user_in_channel(user_id_int):
    """Kanalda foydalanuvchini administrator qilish"""
    try:
        bot.promote_chat_member(
            chat_id=TARGET_CHAT_ID,
            user_id=user_id_int,
            can_manage_chat=True,
            can_post_messages=True,
            can_edit_messages=True,
            can_delete_messages=True,
            can_invite_users=True,
            can_manage_video_chats=True
        )
        logger.info(f"Foydalanuvchi {user_id_int} kanalda admin qilindi.")
        return True
    except Exception as e:
        logger.info(f"Kanalda admin qilish (ehtimol hali a'zo emas): {e}")
        return False


def make_user_admin(message, phone_number):
    """Foydalanuvchini bot va kanalda to'liq administrator qilish"""
    user_id = str(message.from_user.id)
    full_name = message.from_user.full_name or "Noma'lum"
    username = f"@{message.from_user.username}" if message.from_user.username else "Mavjud emas"
    token = db.get("pending_tokens", {}).get(user_id, "Havola_orqali")
    reg_time = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

    # 1. BOT ADMINLARI RO'YXATIGA QO'SHISH
    if "admins" not in db:
        db["admins"] = []
    if user_id not in db["admins"]:
        db["admins"].append(user_id)

    db.setdefault("verified_users", {})[user_id] = {
        "phone": phone_number,
        "name": full_name,
        "username": username,
        "token": token,
        "registered_at": reg_time,
        "role": "Administrator"
    }

    if token != "Havola_orqali" and token not in db.get("used_tokens", []):
        db.setdefault("used_tokens", []).append(token)

    save_data(db)
    supabase_verify_user_async(user_id, full_name, username, phone_number, token)

    # 2. Telegram chatida admin menyusini o'rnatish
    setup_admin_menu(message.chat.id)

    # 3. Guruhga 1 kishilik maxsus havola yaratish (member_limit=1)
    invite_link = None
    try:
        invite_obj = bot.create_chat_invite_link(
            chat_id=TARGET_CHAT_ID,
            member_limit=1,
            name=f"Admin_{user_id}"
        )
        invite_link = invite_obj.invite_link
    except Exception as e:
        logger.warning(f"1 martalik link yaratishda xatolik: {e}")
        invite_link = "https://t.me/AlKhorazmiy_registration"

    # 4. Kanalda admin qilishga urinish (agar allaqachon a'zo bo'lsa)
    promote_user_in_channel(message.from_user.id)

    # 5. Kanalga rasmiy hisobot yuborish
    try:
        report = (
            f"👑 <b>YANGI BOT & KANAL ADMINISTRATORI!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"👤 <b>F.I.Sh:</b> {full_name}\n"
            f"📞 <b>Telefon:</b> <code>{phone_number}</code>\n"
            f"🌐 <b>Username:</b> {username}\n"
            f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n"
            f"⏰ <b>Vaqt:</b> {reg_time}\n"
            f"🔑 <b>Token:</b> <code>{token}</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"✅ <i>Foydalanuvchi Botda va Kanalda to'liq Administrator huquqlariga ega bo'ldi.</i>"
        )
        bot.send_message(TARGET_CHAT_ID, report)
    except Exception as e:
        logger.error(f"Kanalga hisobot yuborishda xatolik: {e}")

    # 6. Foydalanuvchiga tabrik va Admin Paneli xabari
    congrats_text = (
        f"🎉 <b>TABRIKLAYMIZ! SIZ RASMAN ADMINISTRATOR BO'LDINGIZ!</b> 👑\n\n"
        f"👤 <b>F.I.Sh:</b> {full_name}\n"
        f"📞 <b>Telefon raqamingiz:</b> <code>{phone_number}</code> tasdiqlandi.\n"
        f"🆔 <b>ID raqamingiz:</b> <code>{user_id}</code>\n"
        f"👑 <b>Maqomingiz:</b> <b>BOT ADMINISTRATORI</b>\n\n"
        f"<b>Sizga berilgan huquqlar:</b>\n"
        f"✅ <b>Telegram Bot Boshqaruvi:</b> Pastdagi tugmalar orqali bot statistikasini ko'rish, arizalarni tekshirish va kanalga e'lon yuborish.\n"
        f"✅ <b>Rasmiy Kanal:</b> Pastdagi 1 martalik havola orqali kanalga kiring va u yerda ham administrator sifatida faoliyat yuriting!"
    )

    inline_kb = types.InlineKeyboardMarkup()
    if invite_link:
        inline_kb.add(types.InlineKeyboardButton("👉 Rasmiy Kanalga Kirish (1 martalik havola)", url=invite_link))

    bot.send_message(message.chat.id, congrats_text, reply_markup=get_admin_keyboard())
    if invite_link:
        bot.send_message(
            message.chat.id,
            "👇 <b>Kanalga kirish uchun quyidagi shaxsiy havolani bosing:</b>\n"
            "(Ushbu havola faqat siz uchun 1 martalik yaratildi)",
            reply_markup=inline_kb
        )


# ==========================================================
# 1. /start BUYRUG'I
# ==========================================================
@bot.message_handler(commands=["start"])
def handle_start(message):
    args = message.text.split()
    token = args[1] if len(args) > 1 else None
    user_id = str(message.from_user.id)

    # Agar foydalanuvchi allaqachon bot admini bo'lsa
    if user_id in db.get("admins", []):
        setup_admin_menu(message.chat.id)
        bot.send_message(
            message.chat.id,
            f"👑 <b>Xush kelibsiz, Admin {message.from_user.first_name}!</b>\n\n"
            f"Siz botning to'liq <b>Administratorisiz</b>.\n"
            f"Quyidagi tugmalar yoki buyruqlar orqali botni boshqarishingiz mumkin:",
            reply_markup=get_admin_keyboard()
        )
        return

    # Agar token kelsa, Supabase Cloud bilan sinxronlab tekshiramiz
    if token:
        sync_from_supabase()

    # Agar token avval ishlatilgan bo'lsa
    if token and token in db.get("used_tokens", []):
        bot.send_message(
            message.chat.id,
            "⚠️ <b>Kechirasiz, ushbu bir martalik havola allaqachon ishlatilgan!</b>\n"
            "Yangi havola olish uchun saytda ariza qoldiring: https://alkhorazmiyschool.uz"
        )
        return

    if token:
        db.setdefault("pending_tokens", {})[user_id] = token
        save_data(db)

    # Telefon raqamini so'rash (tugma orqali)
    keyboard = types.ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    btn_contact = types.KeyboardButton("📱 Telefon raqamni yuborish", request_contact=True)
    keyboard.add(btn_contact)

    text = (
        f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 🎓\n\n"
        f"<b>Al-Khorazmiy International School</b> rasmiy tizimiga xush kelibsiz!\n\n"
        f"Botda va rasmiy kanalda <b>ADMINISTRATOR (Admin)</b> maqomiga ega bo'lish uchun "
        f"pastdagi <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing yoki telefon raqamingizni "
        f"shu yerga yozib yuboring (masalan: <code>+998901234567</code>):"
    )

    bot.send_message(message.chat.id, text, reply_markup=keyboard)


# ==========================================================
# 2. TELEFON RAQAM TUGMA ORQALI (CONTACT) KELGANDA
# ==========================================================
@bot.message_handler(content_types=["contact"])
def handle_contact(message):
    contact = message.contact
    phone = contact.phone_number
    if not phone.startswith("+"):
        phone = "+" + phone
    make_user_admin(message, phone)


# ==========================================================
# 3. KANALGA YANGI A'ZO QO'SHILGANDA (CHAT_MEMBER UPDATE)
# ==========================================================
@bot.chat_member_handler()
def handle_chat_member_update(update: types.ChatMemberUpdated):
    try:
        new_status = update.new_chat_member.status
        user = update.new_chat_member.user
        if user.is_bot:
            return

        if update.chat.id == TARGET_CHAT_ID and new_status in ["member", "administrator"]:
            user_id_str = str(user.id)
            if user_id_str in db.get("admins", []):
                promote_user_in_channel(user.id)
    except Exception as e:
        logger.error(f"Chat member yangilanishida xatolik: {e}")


# ==========================================================
# 4. ADMIN PANEL FUNKSIYALARI VA BUYRUQLARI
# ==========================================================
@bot.message_handler(commands=["admin"])
def handle_admin_command(message):
    user_id = str(message.from_user.id)
    if user_id in db.get("admins", []):
        setup_admin_menu(message.chat.id)
        bot.send_message(
            message.chat.id,
            "👑 <b>Admin Boshqaruv Paneli:</b>\nKerakli bo'limni tanlang:",
            reply_markup=get_admin_keyboard()
        )
    else:
        bot.reply_to(
            message,
            "⛔ Siz hali administrator emassiz.\n"
            "Iltimos, /start buyrug'ini bosing va telefon raqamingizni tasdiqlang."
        )


@bot.message_handler(commands=["stats"])
@bot.message_handler(func=lambda msg: msg.text == "📊 Statistika")
def admin_stats(message):
    user_id = str(message.from_user.id)
    if user_id not in db.get("admins", []):
        bot.reply_to(message, "⛔ Bu bo'lim faqat tasdiqlangan administratorlar uchun.")
        return

    sync_from_supabase()
    verified_count = len(db.get("verified_users", {}))
    used_tokens_count = len(db.get("used_tokens", []))
    admins_count = len(db.get("admins", []))
    apps_count = len(recent_cloud_apps)
    new_apps = sum(1 for a in recent_cloud_apps if a.get("status") == "new")

    text = (
        f"📊 <b>BOT VA SUPABASE CLOUD STATISTIKASI</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"📝 <b>Oxirgi onlayn arizalar (Cloud):</b> {apps_count} ta (yangi: {new_apps} ta)\n"
        f"👥 <b>Tasdiqlangan foydalanuvchilar:</b> {verified_count} ta\n"
        f"👑 <b>Administratorlar soni:</b> {admins_count} ta\n"
        f"🔑 <b>Ishlatilgan 1 martalik tokenlar:</b> {used_tokens_count} ta\n"
        f"📢 <b>Ulangan kanal:</b> @AlKhorazmiy_registration\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"⏰ <i>Vaqt: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}</i>"
    )
    bot.send_message(message.chat.id, text, reply_markup=get_admin_keyboard())


@bot.message_handler(commands=["users"])
@bot.message_handler(func=lambda msg: msg.text == "📋 Oxirgi arizalar")
def admin_last_requests(message):
    user_id = str(message.from_user.id)
    if user_id not in db.get("admins", []):
        bot.reply_to(message, "⛔ Bu bo'lim faqat administratorlar uchun.")
        return

    sync_from_supabase()
    status_labels = {
        "new": "🆕 Yangi",
        "contacted": "📞 Bog'lanildi",
        "enrolled": "✅ Qabul qilindi",
        "rejected": "❌ Rad etildi",
    }

    if recent_cloud_apps:
        text = "📋 <b>SAYTDAN KELGAN OXIRGI ARIZALAR (SUPABASE):</b>\n━━━━━━━━━━━━━━━━━━━━━\n"
        for app_row in recent_cloud_apps[:10]:
            aid = app_row.get("id", "")
            p_name = html.escape(str(app_row.get("parent_name", "")))
            c_name = html.escape(str(app_row.get("child_name", "")))
            ph = html.escape(str(app_row.get("phone", "")))
            gr = html.escape(str(app_row.get("grade", "")))
            st_lbl = status_labels.get(app_row.get("status", "new"), "🆕 Yangi")
            c_at = str(app_row.get("created_at", ""))[:16].replace("T", " ")
            text += (
                f"<b>#{aid}</b> | {st_lbl}\n"
                f"👤 Ota-ona: <b>{p_name}</b>\n"
                f"👶 Farzand: <b>{c_name}</b> ({gr}-sinf)\n"
                f"📞 Tel: <code>{ph}</code> | ⏰ {c_at}\n"
                f"─────────────────────\n"
            )
    else:
        users = db.get("verified_users", {})
        if not users:
            bot.send_message(message.chat.id, "📭 Hozircha arizalar mavjud emas.")
            return
        text = "📋 <b>OXIRGI RO'YXATDAN O'TGANLAR:</b>\n━━━━━━━━━━━━━━━━━━━━━\n"
        for uid, data in list(users.items())[-10:]:
            u_name = html.escape(str(data.get("name", "Noma'lum")))
            u_user = html.escape(str(data.get("username", "")))
            u_phone = html.escape(str(data.get("phone", "")))
            text += (
                f"👤 <b>{u_name}</b> ({u_user})\n"
                f"📞 Tel: <code>{u_phone}</code> | 🆔 <code>{uid}</code>\n"
                f"─────────────────────\n"
            )

    bot.send_message(message.chat.id, text, reply_markup=get_admin_keyboard())


@bot.message_handler(func=lambda msg: msg.text == "👑 Adminlar ro'yxati")
def admin_list_handler(message):
    user_id = str(message.from_user.id)
    if user_id not in db.get("admins", []):
        bot.reply_to(message, "⛔ Bu bo'lim faqat administratorlar uchun.")
        return

    admins = db.get("admins", [])
    users = db.get("verified_users", {})
    text = f"👑 <b>BOT ADMINISTRATORLARI RO'YXATI ({len(admins)} ta):</b>\n━━━━━━━━━━━━━━━━━━━━━\n"
    for idx, aid in enumerate(admins, 1):
        uinfo = users.get(aid, {})
        uname = uinfo.get("name", "Foydalanuvchi")
        uuser = uinfo.get("username", "")
        uphone = uinfo.get("phone", "")
        text += f"{idx}. <b>{uname}</b> {uuser}\n   📞 {uphone} | 🆔 <code>{aid}</code>\n\n"

    bot.send_message(message.chat.id, text, reply_markup=get_admin_keyboard())


@bot.message_handler(commands=["newlink"])
@bot.message_handler(func=lambda msg: msg.text == "🔑 Yangi 1 martalik link")
def admin_new_link(message):
    user_id = str(message.from_user.id)
    if user_id not in db.get("admins", []):
        bot.reply_to(message, "⛔ Bu bo'lim faqat administratorlar uchun.")
        return

    try:
        one_time_tok = f"join_{secrets.token_hex(4)}"
        bot_link = f"https://t.me/al_khorazmiy_registration_bot?start={one_time_tok}"
        db.setdefault("pending_tokens", {})[one_time_tok] = {
            "parent": f"Admin {message.from_user.first_name}",
            "created_at": datetime.now().strftime("%d.%m.%Y %H:%M"),
        }
        save_data(db)
        supabase_create_token_async(one_time_tok, f"Admin {message.from_user.first_name}")

        invite = bot.create_chat_invite_link(
            chat_id=TARGET_CHAT_ID,
            member_limit=1,
            name=f"Manual_{datetime.now().strftime('%H%M%S')}"
        )
        text = (
            f"🔑 <b>YANGI BIR MARTALIK HAVOLALAR YARATILDI!</b>\n\n"
            f"1️⃣ <b>Bot orqali tasdiqlash havolasi (Cloud):</b>\n"
            f"👉 <code>{bot_link}</code>\n\n"
            f"2️⃣ <b>To'g'ridan-to'g'ri kanal havolasi (1 kishilik):</b>\n"
            f"👉 <code>{invite.invite_link}</code>\n\n"
            f"<i>Havolani yangi ota-ona yoki xodimga yuborishingiz mumkin.</i>"
        )
        bot.send_message(message.chat.id, text, reply_markup=get_admin_keyboard())
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ Havola yaratishda xatolik: {e}")


def format_channel_post(raw_text: str) -> str:
    """Oddiy matnni rasmiy, emojili va chiroyli Al-Khorazmiy postiga aylantirish"""
    if not raw_text:
        raw_text = "Yangi xabar va e'lon!"
    text_clean = raw_text.strip()

    # Agar xabar allaqachon rasmiy shablonda bo'lsa, o'zgartirmaslik
    if "━━━━━━━━━━━━━━━━━━━━━" in text_clean or "Al-Khorazmiy International School" in text_clean:
        return text_clean

    lower_txt = text_clean.lower()

    # Mavzuga mos sarlavha va emojilarni tanlash
    if any(k in lower_txt for k in ["imtihon", "grand", "grant", "stipendiya", "test", "olimpiada"]):
        badge = "🎓🏆 <b>MAXSUS E'LON — GRANT VA IMTIHON!</b> 🏆🎓"
        lead_emoji = "🔥"
        sub_quote = (
            "🎯 <i>Bilimingizni sinovdan o'tkazing va <b>Al-Khorazmiy International School</b>da "
            "maxsus GRANT asosida o'qish imkoniyatini qo'lga kiriting!</i>"
        )
    elif any(k in lower_txt for k in ["qabul", "ro'yxat", "ariza", "sinf", "o'quv yili"]):
        badge = "📝✨ <b>QABUL DAVOM ETMOQDA!</b> ✨📝"
        lead_emoji = "🚀"
        sub_quote = "🌟 <i>Farzandingizga xalqaro darajadagi zamonaviy va sifatli ta'lim bering — joylar soni cheklangan!</i>"
    elif any(k in lower_txt for k in ["sertifikat", "natija", "g'olib", "cefr", "ielts", "yutuq", "tabrik", "medal"]):
        badge = "🥇🎉 <b>O'QUVCHILARIMIZNING FAXRLI YUTUG'I!</b> 🎉🥇"
        lead_emoji = "🏅"
        sub_quote = "👏 <i>Tinimsiz mehnat va malakali ustozlarimizning fidokorona ta'limi o'z mevasini bermoqda!</i>"
    else:
        badge = "📢✨ <b>RASMIY E'LON VA YANGILIK!</b> ✨📢"
        lead_emoji = "💎"
        sub_quote = "🌟 <i>Al-Khorazmiy International School — yorqin kelajak sari ishonchli qadam!</i>"

    # Matn qatorlarini chiroyli formatlash
    lines = [line.strip() for line in text_clean.splitlines() if line.strip()]
    formatted_lines = []
    bullet_emojis = [lead_emoji, "📌", "✅", "✨", "🔹", "💡"]
    for idx, line in enumerate(lines):
        if line and line[0].islower():
            line = line[0].upper() + line[1:]
        if idx == 0 and line and line[-1] not in ".!?…:":
            line = line + "!"
        em = bullet_emojis[idx % len(bullet_emojis)]
        if idx == 0:
            formatted_lines.append(f"{em} <b>{line}</b>")
        else:
            formatted_lines.append(f"{em} {line}")

    body_text = "\n\n".join(formatted_lines)

    formatted_post = (
        f"{badge}\n"
        f"🏫 <b>Al-Khorazmiy International School</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"{body_text}\n\n"
        f"{sub_quote}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"📚 <b>Bizning ustunliklarimiz:</b>\n"
        f"🔹 <i>Chuqurlashtirilgan Matematika, Ingliz tili (IELTS/CEFR) va Tarix</i>\n"
        f"🔹 <i>Zamonaviy STEM & IT laboratoriyalar hamda 3 mahal issiq ovqat</i>\n"
        f"🔹 <i>Tajribali ustozlar va har bir o'quvchiga individual yondashuv</i>\n\n"
        f"📍 <b>Manzil:</b> Namangan tumani, Qumqo'rg'on shaharchasi\n"
        f"📞 <b>Murojaat uchun:</b> <code>+998 77 000 11 22</code>\n"
        f"🤖 <b>Ro'yxatdan o'tish:</b> @al_khorazmiy_registration_bot\n"
        f"📢 <b>Rasmiy kanal:</b> @AlKhorazmiy_registration"
    )
    return formatted_post


def get_channel_post_keyboard():
    """Kanal postlari ostiga qo'yiladigan interaktiv tugmalar"""
    markup = types.InlineKeyboardMarkup(row_width=1)
    markup.add(
        types.InlineKeyboardButton(
            "📝 Ro'yxatdan o'tish / Ariza topshirish",
            url="https://t.me/al_khorazmiy_registration_bot"
        ),
        types.InlineKeyboardButton(
            "📢 Rasmiy kanalimizga ulanish",
            url="https://t.me/AlKhorazmiy_registration"
        )
    )
    return markup


@bot.message_handler(commands=["broadcast"])
@bot.message_handler(func=lambda msg: msg.text == "📢 Kanalga e'lon yuborish")
def admin_broadcast_prompt(message):
    user_id = str(message.from_user.id)
    if user_id not in db.get("admins", []):
        bot.reply_to(message, "⛔ Bu bo'lim faqat administratorlar uchun.")
        return

    msg = bot.send_message(
        message.chat.id,
        "✍️ <b>Kanalga joylamoqchi bo'lgan e'lon matnini (yoki rasm/video bilan izohni) yuboring:</b>\n\n"
        "💡 <i>Oddiy matn yozsangiz ham bot uni avtomatik ravishda emojilar, chiroyli dizayn va "
        "tugmalar bilan boyitib kanalga joylaydi!</i>\n\n"
        "(Bekor qilish uchun <code>/cancel</code> deb yozing)"
    )
    bot.register_next_step_handler(msg, process_broadcast_message)


def process_broadcast_message(message):
    if message.text and message.text.strip() == "/cancel":
        bot.send_message(message.chat.id, "❌ Bekor qilindi.", reply_markup=get_admin_keyboard())
        return

    try:
        post_kb = get_channel_post_keyboard()
        if message.content_type == "photo":
            raw_caption = message.caption or ""
            styled_caption = format_channel_post(raw_caption)
            bot.send_photo(
                TARGET_CHAT_ID,
                message.photo[-1].file_id,
                caption=styled_caption,
                reply_markup=post_kb
            )
        elif message.content_type == "video":
            raw_caption = message.caption or ""
            styled_caption = format_channel_post(raw_caption)
            bot.send_video(
                TARGET_CHAT_ID,
                message.video.file_id,
                caption=styled_caption,
                reply_markup=post_kb
            )
        else:
            raw_text = message.text or message.caption or ""
            styled_text = format_channel_post(raw_text)
            bot.send_message(
                TARGET_CHAT_ID,
                styled_text,
                reply_markup=post_kb
            )

        bot.send_message(
            message.chat.id,
            "✅ <b>E'loningiz emojilar va rasmiy dizayn bilan @AlKhorazmiy_registration kanaliga muvaffaqiyatli joylandi!</b>",
            reply_markup=get_admin_keyboard()
        )
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ Xabar yuborishda xatolik: {e}", reply_markup=get_admin_keyboard())


@bot.channel_post_handler(content_types=["text", "photo", "video"])
@bot.edited_channel_post_handler(content_types=["text", "photo", "video"])
def auto_style_channel_post(message):
    """Kanalning o'zida oddiy matn yozilganda ham uni avtomatik chiroyli dizayn va emojilarga o'girish"""
    try:
        post_kb = get_channel_post_keyboard()
        if message.content_type == "text":
            raw_text = message.text or ""
            if "━━━━━━━━━━━━━━━━━━━━━" in raw_text or "Al-Khorazmiy International School" in raw_text:
                return
            styled_text = format_channel_post(raw_text)
            try:
                bot.edit_message_text(
                    chat_id=message.chat.id,
                    message_id=message.message_id,
                    text=styled_text,
                    reply_markup=post_kb
                )
                logger.info(f"Kanal posti #{message.message_id} tahrirlanib chiroyli formatga o'girildi.")
            except Exception:
                # Agar odam tomonidan yozilgan postni Telegram tahrirlashga ruxsat bermasa,
                # oddiy postni o'chirib o'rniga chiroyli bezatilgan postni joylaymiz
                try:
                    bot.delete_message(message.chat.id, message.message_id)
                except Exception as del_err:
                    logger.warning(f"Eski oddiy postni o'chirishda xatolik: {del_err}")
                bot.send_message(
                    message.chat.id,
                    styled_text,
                    reply_markup=post_kb
                )
                logger.info(f"Kanal posti #{message.message_id} yangi chiroyli formatda qayta joylandi.")

        elif message.content_type in ("photo", "video"):
            raw_caption = message.caption or ""
            if "━━━━━━━━━━━━━━━━━━━━━" in raw_caption or "Al-Khorazmiy International School" in raw_caption:
                return
            styled_caption = format_channel_post(raw_caption)
            try:
                bot.edit_message_caption(
                    chat_id=message.chat.id,
                    message_id=message.message_id,
                    caption=styled_caption,
                    reply_markup=post_kb
                )
                logger.info(f"Kanal media posti #{message.message_id} tahrirlanib chiroyli formatga o'girildi.")
            except Exception:
                try:
                    bot.delete_message(message.chat.id, message.message_id)
                except Exception as del_err:
                    logger.warning(f"Eski media postni o'chirishda xatolik: {del_err}")
                if message.content_type == "photo":
                    bot.send_photo(
                        message.chat.id,
                        message.photo[-1].file_id,
                        caption=styled_caption,
                        reply_markup=post_kb
                    )
                else:
                    bot.send_video(
                        message.chat.id,
                        message.video.file_id,
                        caption=styled_caption,
                        reply_markup=post_kb
                    )
                logger.info(f"Kanal media posti #{message.message_id} yangi chiroyli formatda qayta joylandi.")
    except Exception as e:
        logger.error(f"Kanal postini avtomatik bezashda xatolik: {e}")


# ==========================================================
# 5. MATNLI XABARLARNI QABUL QILISH (TELEFON RAQAM BO'LSA)
# ==========================================================
@bot.message_handler(content_types=["text"])
def handle_generic_text(message):
    user_id = str(message.from_user.id)
    text = message.text.strip()

    # Agar foydalanuvchi allaqachon admin bo'lsa
    if user_id in db.get("admins", []):
        bot.send_message(
            message.chat.id,
            "👑 <b>Admin Paneli:</b> Quyidagi tugmalardan birini tanlang:",
            reply_markup=get_admin_keyboard()
        )
        return

    # Telefon raqami formatini tekshirish (masalan: +998901234567, 998901234567, 901234567)
    digits = re.sub(r"\D", "", text)
    if len(digits) >= 9:
        if not digits.startswith("998"):
            if len(digits) == 9:
                digits = "998" + digits
        formatted_phone = "+" + digits
        make_user_admin(message, formatted_phone)
        return

    # Agar telefon raqam bo'lmasa, raqam yuborishni so'rash
    keyboard = types.ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    btn_contact = types.KeyboardButton("📱 Telefon raqamni yuborish", request_contact=True)
    keyboard.add(btn_contact)

    bot.send_message(
        message.chat.id,
        "Iltimos, botda <b>Administrator</b> bo'lish uchun pastdagi "
        "<b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing yoki "
        "telefon raqamingizni yozib yuboring (masalan: <code>+998 90 123 45 67</code>).",
        reply_markup=keyboard
    )


# ==========================================================
# 6. WEB API & WEBHOOK (ARIZALARNI XAVFSIZ QABUL QILISH)
# ==========================================================
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Flask loglarini sokin qilish
logging.getLogger("werkzeug").setLevel(logging.WARNING)

BLOCKED_EXTENSIONS = (".py", ".pyc", ".json", ".bat", ".bak", ".env", ".log", ".git")

@app.before_request
def protect_sensitive_files():
    req_path = (request.path or "").lower()
    if any(req_path.endswith(ext) for ext in BLOCKED_EXTENSIONS) or "/." in req_path:
        abort(403)

@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

@app.route("/admin")
def serve_admin():
    return send_from_directory(".", "admin.html")

@app.route("/api/apply", methods=["POST", "OPTIONS"])
def handle_web_application():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"ok": False, "error": "Bo'sh ma'lumot"}), 400

    parent = html.escape(str(data.get("parent", "")).strip())
    child = html.escape(str(data.get("child", "")).strip())
    phone = html.escape(str(data.get("phone", "")).strip())
    grade = html.escape(str(data.get("grade", "")).strip())
    time_str = html.escape(str(data.get("time") or datetime.now().strftime("%d.%m.%Y %H:%M")).strip())

    if not parent or not child or not phone or not grade:
        return jsonify({"ok": False, "error": "Barcha maydonlar to'ldirilishi shart"}), 400

    # Avval Supabase Cloud submit-application Edge Function orqali saqlash va yuborish
    try:
        cloud_req = urllib.request.Request(
            SUBMIT_APP_URL,
            data=json.dumps({
                "parent": str(data.get("parent", "")).strip(),
                "child": str(data.get("child", "")).strip(),
                "phone": str(data.get("phone", "")).strip(),
                "grade": str(data.get("grade", "")).strip(),
                "time": str(data.get("time") or datetime.now().strftime("%d.%m.%Y %H:%M")).strip(),
            }).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "apikey": SUPABASE_PUB_KEY,
            },
            method="POST",
        )
        with urllib.request.urlopen(cloud_req, timeout=10) as c_resp:
            c_json = json.loads(c_resp.read().decode("utf-8"))
            if c_json.get("ok"):
                sync_from_supabase()
                return jsonify(c_json), 200
    except Exception as cloud_err:
        logger.warning(f"Cloud submit-application xatosi, lokal zaxira ishlatilmoqda: {cloud_err}")

    # Lokal zaxira: 1 martalik xavfsiz token yaratish
    one_time_token = f"join_{secrets.token_hex(4)}"
    bot_deep_link = f"https://t.me/al_khorazmiy_registration_bot?start={one_time_token}"

    # Tokenni bazaga yozish
    global db
    db = load_data()
    db.setdefault("pending_tokens", {})[one_time_token] = {
        "parent": parent,
        "child": child,
        "phone": phone,
        "grade": grade,
        "created_at": time_str
    }
    save_data(db)

    # Kanalga rasmiy chiroyli xabar yuborish
    message_text = (
        f"📩 <b>YANGI QABUL ARIZASI!</b>\n"
        f"🏫 <b>Al-Khorazmiy International School</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Ota-ona F.I.Sh:</b> {parent}\n"
        f"👶 <b>Farzand F.I.Sh:</b> {child}\n"
        f"📞 <b>Telefon raqam:</b> <code>{phone}</code>\n"
        f"🎓 <b>Qaysi sinfga:</b> {grade}-sinf\n"
        f"⏰ <b>Yuborilgan vaqt:</b> {time_str}\n"
        f"🔑 <b>1 martalik token:</b> <code>{one_time_token}</code>\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"📢 <i>Kanal: @AlKhorazmiy_registration</i>"
    )

    try:
        bot.send_message(TARGET_CHAT_ID, message_text)
        logger.info(f"Yangi ariza kanalga yuborildi: {parent} ({phone})")
    except Exception as e:
        logger.error(f"Kanalga ariza yuborishda xatolik: {e}")

    return jsonify({
        "ok": True,
        "message": "Arizangiz qabul qilindi!",
        "botDeepLink": bot_deep_link,
        "token": one_time_token
    })


def run_web_server():
    try:
        logger.info("Web API server http://127.0.0.1:5000 da ishga tushmoqda...")
        app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    except Exception as e:
        logger.error(f"Web server xatosi: {e}")


# ==========================================================
# ASOSIY ISHGA TUSHIRISH
# ==========================================================
if __name__ == "__main__":
    print("=" * 60)
    print("Al-Khorazmiy Telegram Bot & Web API ishga tushdi!")
    print(f"Bot: @al_khorazmiy_registration_bot")
    print(f"Kanal: {TARGET_CHAT_ID} (@AlKhorazmiy_registration)")
    print(f"Web API: http://127.0.0.1:5000 (POST /api/apply)")
    print(f"Super Admin: {OWNER_ID} (@asadbek21mamatov)")
    print("=" * 60)

    # Web serverni alohida oqimda (background daemon) ishga tushirish
    web_thread = threading.Thread(target=run_web_server, daemon=True)
    web_thread.start()

    # Telegram bot polling (xatolik yoki 409 bo'lsa ham Web API to'xtab qolmaydi)
    while True:
        try:
            bot.infinity_polling(
                skip_pending=True,
                allowed_updates=["message", "chat_member", "my_chat_member", "channel_post", "edited_channel_post", "callback_query"]
            )
        except Exception as e:
            logger.warning(f"Telegram polling vaqtinchalik uzildi (5s dan so'ng qayta ulanadi): {e}")
            time.sleep(5)
