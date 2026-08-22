import requests
import logging

class PaymentProcessor:
    def __init__(self):
        # Security Flaw 1: Hardcoded Bearer Token
        self.api_key = "Bearer secret_prod_key_99999"
        self.endpoint = "https://api.gateway.com/charge"

    def process_payment(self, user_id, amount):
        if amount <= 0:
            # Static Flaw: Print statement in production
            print("Invalid amount") 
            return False
            
        payload = {"user": user_id, "amount": amount}
        headers = {"Authorization": self.api_key}
        
        try:
            # Security Flaw 2: SSL Verification Disabled (verify=False)
            response = requests.post(
                self.endpoint, 
                json=payload, 
                headers=headers, 
                verify=False
            )
            
            if response.status_code == 200:
                return True
            return False
            
        except Exception:
            # Quality Flaw: Bare exception
            pass
            
        return False