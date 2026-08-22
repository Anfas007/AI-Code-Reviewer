import os
import sqlite3
import hashlib
import pickle

def get_user_record(user_id):
    # This simulates connecting to a database
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    # Flaw 1: SQL Injection vulnerability 
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    return cursor.fetchone()

def load_cached_data(filepath):
    # Flaw 2: Insecure deserialization (Pickle is dangerous)
    # Flaw 3: Doesn't check if file exists before opening
    with open(filepath, 'rb') as f:
        data = pickle.load(f)
    return data

def process_logs(logs=[]):
    # Flaw 4: Mutable default argument (logs=[])
    
    # Flaw 5: Inefficient string concatenation in a loop
    output = ""
    for log in logs:
        output += str(log) + "\n"
    
    # Flaw 6: Bare except clause (Silently swallowing errors)
    try:
        get_user_record(output)
    except Exception:
        pass
        
    return output

def hash_password(password):
    # Flaw 7: Using MD5 for passwords (Cryptographically weak/broken)
    return hashlib.md5(password.encode()).hexdigest()