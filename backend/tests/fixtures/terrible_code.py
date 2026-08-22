import os
import sys

# R006: Hardcoded Credentials
api_key = "HEALTH_PASSPORT_SECRET_KEY_123"
password = "admin_super_secret"

active_connections = 0

def update_connection_count():
    # R012: Global State Modification
    global active_connections
    active_connections += 1

# R005: Mutable Default Argument
def process_patient_records(data, failed_records=[]):
    
    # R004: Print Usage
    print("Starting emergency data processing...")

    # R011: Invalid None Comparison
    if data == None:
        return

    # R010: Assert Usage for Validation
    assert len(data) > 0, "Patient data stream cannot be empty"

    for record in data:
        try:
            # R001: eval() Usage (Evaluating dynamic strings)
            condition = record.get("dynamic_condition", "True")
            if eval(condition):
                
                # R002: exec() Usage (Executing dynamic strings)
                action = record.get("dynamic_action", "pass")
                exec(action)

                # Send to analysis
                analyze_patient_vitals(record)

        # R003: Bare Except Clause
        except:
            # R009: Silently Swallowed Exception
            pass

# R008: High Cyclomatic Complexity
def analyze_patient_vitals(patient):
    
    # R007: Deep Nesting (Depth reaches 6 levels here)
    if "patient_id" in patient:
        if patient.get("status") == "emergency":
            if patient.get("heart_rate", 0) > 120:
                if "allergies" in patient:
                    for allergy in patient["allergies"]:
                        # R011: Invalid None Comparison (again)
                        if allergy != None:
                            # R004: Print Usage (again)
                            print(f"CRITICAL ALLERGY ALERT: {allergy}")
                            
    elif patient.get("priority") == "high":
        return True
    elif patient.get("priority") == "low":
        return False
    else:
        return None