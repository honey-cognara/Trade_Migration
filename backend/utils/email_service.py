"""
Email service using Gmail SMTP + App Password.
Sends 6-digit OTP codes for email verification.
"""

import os
import asyncio
import smtplib
import random
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root regardless of working directory
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)

_logger = logging.getLogger(__name__)


def _get_credentials():
    return os.getenv("EMAIL_USER", ""), os.getenv("EMAIL_PASS", "")


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


def _build_email(to_email: str, subject: str, html_body: str):
    email_user, _ = _get_credentials()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = email_user
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    return msg


async def _dispatch(msg) -> bool:
    email_user, email_pass = _get_credentials()

    def _send():
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send)
        return True
    except Exception as e:
        _logger.error("Failed to send email to %s: %s", msg["To"], e)
        return False


async def send_otp_email(to_email: str, otp: str) -> bool:
    """Send a 6-digit registration OTP via Gmail SMTP."""
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
        &#9203; This code expires in <strong>2 minutes</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        If you did not create an account, please ignore this email.
      </p>
    </div>
    """
    msg = _build_email(to_email, "Your Tradie Migration App verification code", html_body)
    sent = await _dispatch(msg)
    if sent:
        _logger.info("Registration OTP sent to %s", to_email)
    return sent


async def send_password_reset_email(to_email: str, otp: str) -> bool:
    """Send a 6-digit password-reset OTP via Gmail SMTP."""
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                padding: 32px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Reset your password</h2>
      <p style="color: #475569; font-size: 15px;">
        We received a request to reset the password for your
        <strong>Tradie Migration App</strong> account.
        Enter the code below to continue.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-size: 38px; font-weight: 700; letter-spacing: 10px;
                     color: #f97316; background: #fff7ed; padding: 16px 28px;
                     border-radius: 8px; display: inline-block;">
          {otp}
        </span>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center;">
        &#9203; This code expires in <strong>2 minutes</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        If you did not request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
    </div>
    """
    msg = _build_email(to_email, "Tradie Migration App — password reset code", html_body)
    sent = await _dispatch(msg)
    if sent:
        _logger.info("Password reset OTP sent to %s", to_email)
    return sent
