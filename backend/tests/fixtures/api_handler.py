import os

# Global Configuration
API_SECRET = "sk_live_1234567890abcdef"

def get_document(filename):
    # Flaw 1: Path Traversal Vulnerability
    filepath = "/var/data/" + filename
    
    # Flaw 2: Resource Management (No 'with' statement)
    f = open(filepath, 'r')
    content = f.read()
    f.close()
    
    return content

def parse_config(config_string):
    # Flaw 3: Dangerous Code Execution
    return eval(config_string)

def clean_data(data_list):
    # Flaw 4: Modifying a list while iterating over it
    for item in data_list:
        if item == "DROP":
            data_list.remove(item)
            
    return data_list