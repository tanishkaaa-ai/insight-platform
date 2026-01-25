
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

def send_email(to_email, subject, body_html, from_email=None, from_name="Insight Platform"):
    """
    Send an HTML email using SMTP.
    Falls back to logging if SMTP is not configured.
    """
    
    # Configuration
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    
    if not from_email:
        from_email = os.getenv('SMTP_FROM_EMAIL', 'no-reply@insight-platform.com')

    # If no credentials, simulate
    if not smtp_user or not smtp_pass:
        logger.warning(f" [MOCK EMAIL] To: {to_email} | Subject: {subject} | From: {from_name} <{from_email}>")
        logger.warning(f" [MOCK BODY] {body_html[:100]}...")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg['Reply-To'] = from_email

        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
