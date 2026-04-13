from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv() # Load variables from .env

# Configure Flask to serve frontend files from the parent directory
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
CORS(app)

# --- Configuration ---
LEADS_FILE = 'leads.json'
TARGET_EMAIL = os.environ.get('TARGET_EMAIL', 'spicebayproptech@gmail.com')

# Credentials from .env
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'spicebayproptech@gmail.com')
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', '').strip()

# --- Serve Frontend Routes ---
@app.route('/')
def serve_index():
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(frontend_dir, path)

# --- API Logic ---
def save_lead(data):
    leads = []
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, 'r') as f:
            try:
                leads = json.load(f)
            except:
                leads = []
    
    data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    leads.append(data)
    
    with open(LEADS_FILE, 'w') as f:
        json.dump(leads, f, indent=4)

def send_email_notification(lead_data):
    if not SENDER_PASSWORD:
        print("⚠️ No SENDER_PASSWORD set. Skipping email, lead saved to leads.json")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = TARGET_EMAIL
        msg['Subject'] = f"New Priority Enquiry: {lead_data.get('name', 'Client')}"

        body = f"""
        <html>
            <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #c9a227; border-radius: 10px;">
                    <h2 style="color: #c9a227; border-bottom: 2px solid #c9a227; padding-bottom: 10px;">New Spicebay Lead!</h2>
                    <p><strong>Name:</strong> {lead_data.get('name', 'N/A')}</p>
                    <p><strong>Email:</strong> {lead_data.get('email', lead_data.get('phone', 'N/A'))}</p>
                    <p><strong>Requirement:</strong> {lead_data.get('message', lead_data.get('interest', 'Direct Enquiry'))}</p>
                    <hr>
                    <p style="font-size: 0.8rem; color: #666;">This is an automated notification from your Spicebay Proptech Portal.</p>
                </div>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Email failed: {str(e)}")
        return False

@app.route('/api/enquiry', methods=['POST'])
def handle_enquiry():
    try:
        data = request.json
        if not data:
            data = request.form.to_dict()
            
        print(f"📩 New Lead Received: {data.get('name')}")
        
        # 1. Save to JSON "Database"
        save_lead(data)
        
        # 2. Try to Send Email
        email_sent = send_email_notification(data)
        
        return jsonify({
            "status": "success",
            "message": "Enquiry processed successfully",
            "email_sent": email_sent,
            "id": datetime.now().timestamp()
        }), 200
    except Exception as e:
        print(f"🔥 Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/test-email', methods=['GET'])
def test_email():
    """Diagnostic route to test SMTP connection"""
    test_data = {
        "name": "Test User",
        "email": "test@example.com",
        "message": "This is a diagnostic test of the Spicebay Email System."
    }
    success = send_email_notification(test_data)
    if success:
        return jsonify({"status": "success", "message": f"Test email sent successfully to {TARGET_EMAIL}"})
    else:
        return jsonify({
            "status": "error", 
            "message": "Failed to send test email. Check console for details.",
            "hint": "Ensure SENDER_PASSWORD is set in .env with a 16-character Gmail App Password."
        }), 500

if __name__ == '__main__':
    print("\n" + "="*40)
    print("      SPICEBAY FULL-STACK SERVER")
    print("      Home: http://localhost:5000")
    print("      API:  http://localhost:5000/api/enquiry")
    print("="*40 + "\n")
    app.run(port=5000, debug=True)
