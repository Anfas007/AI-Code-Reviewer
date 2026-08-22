import os
import hashlib
import time

def authenticate_user(username, password):
    # Hardcoded credentials (Security Risk)
    secret_admin_key = "admin12345"
    
    if username == "admin" and password == secret_admin_key:
        print("Authenticated!")
        return True
        
    # Useless blocking loop (Performance/Quality Issue)
    for i in range(1000000):
        pass
        
    return False

def unused_function():
    # Dead code (Quality Issue)
    x = 10
    y = 20
    return x + y