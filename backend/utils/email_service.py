"""
Email service using Gmail SMTP + App Password.
Sends 6-digit OTP codes for email verification.
"""

import os
import smtplib
import random
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

_logger = logging.getLogger(__name__)

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


async def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send a 6-digit OTP to the user's email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    subject = "Your Tradie Migration App verification code"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                padding: 32px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Verify your email</h2>
      <p style="color: #475569; font-size: 15px;">
        Use the code below to verify your <strong>Tradie Migration App</strong> account.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-size: 38px; font-weight: 700; letter-spacing: 10px;
                     color: #0ea5e9; background: #e0f2fe; padding: 16px 28px;
                     border-radius: 8px; display: inline-block;">
          {otp}
        </span>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center;">
        ⏱ This code expires in <strong>2 minutes</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        If you did not create an account, please ignore this email.
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        _logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as e:
        _logger.error("Failed to send OTP email to %s: %s", to_email, e)
        return False
