"""
🔓 ZENITHSCORES BACKEND SECURITY UTILITIES
Python implementation of AES-256-CBC encryption to match frontend security.ts
"""

import base64
import os
import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "your-fallback-32-byte-key-here-!!!")

def get_cipher_key():
    """Ensure key is exactly 32 bytes using SHA-256"""
    return hashlib.sha256(ENCRYPTION_KEY.encode()).digest()

def encrypt(text: str) -> str:
    """Encrypt text using AES-256-CBC"""
    if not text:
        return ""
    
    key = get_cipher_key()
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    ct_bytes = cipher.encrypt(pad(text.encode(), AES.block_size))
    
    iv_hex = iv.hex()
    ct_hex = ct_bytes.hex()
    
    return f"{iv_hex}:{ct_hex}"

def decrypt(text: str) -> str:
    """Decrypt text using AES-256-CBC"""
    if not text:
        return ""
    
    try:
        key = get_cipher_key()
        parts = text.split(":")
        iv = bytes.fromhex(parts[0])
        ct = bytes.fromhex(parts[1])
        
        cipher = AES.new(key, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        
        return pt.decode('utf-8')
    except Exception as e:
        print(f"Decryption failed: {e}")
        return "DECRYPTION_ERROR"

def mask_key(key: str) -> str:
    """UX-friendly masking"""
    if not key or len(key) < 8:
        return "****"
    return key[:4] + "..." + key[-4:]
