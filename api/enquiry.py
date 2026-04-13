from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

TARGET_EMAIL = os.environ.get('TARGET_EMAIL', 'spicebayproptech@gmail.com')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'spicebayproptech@gmail.com')
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', '').strip()

def send_email_notification(lead_data):
    if not SENDER_PASSWORD:
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
                    <p><strong>Phone:</strong> {lead_data.get('phone', 'N/A')}</p>
                    <p><strong>Interest:</strong> {lead_data.get('interest', 'Direct Enquiry')}</p>
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
        print(f"Email failed: {str(e)}")
        return False

@app.route('/api/enquiry', methods=['POST'])
def handle_enquiry():
    try:
        data = request.json or request.form.to_dict()
        email_sent = send_email_notification(data)
        return jsonify({
            "status": "success",
            "message": "Enquiry processed successfully",
            "email_sent": email_sent
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Vercel needs the app object
# But for a specific endpoint file, it's safer to have the route match the filename if possible
# Or use rewrites. Since we used /api/enquiry in the frontend, this file being api/enquiry.py
# will naturally map to /api/enquiry in Vercel's zero-config mode.
