"""
Email service for OTP delivery.
Uses Gmail SMTP if EMAIL_USER / EMAIL_PASS are set.
Falls back to console logging in dev mode.
"""

import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USER or "noreply@tradie.com")


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def otp_expiry() -> datetime:
    """Return OTP expiry time (10 minutes from now, naive UTC)."""
    return datetime.utcnow() + timedelta(minutes=10)


def send_otp_email(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """
    Send OTP email. Returns True if sent successfully.
    Falls back to console print if SMTP not configured.
    """
    subject_map = {
        "verification": "Verify your Tradie Migration account",
        "reset": "Reset your Tradie Migration password",
    }
    subject = subject_map.get(purpose, "Your Tradie Migration OTP")

    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
      <h2 style="color: #3d6b3d;">{"Verify Your Email" if purpose == "verification" else "Password Reset"}</h2>
      <p style="color: #5a7a5a; font-size: 0.95rem;">
        {"Welcome to Tradie Migration! Use the code below to verify your email address." if purpose == "verification"
         else "Use the code below to reset your password."}
      </p>
      <div style="background: #e8f4e8; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
        <div style="font-size: 2.2rem; font-weight: 900; letter-spacing: 0.25em; color: #3d6b3d;">{otp}</div>
        <p style="color: #9ab89a; font-size: 0.8rem; margin: 0.5rem 0 0;">This code expires in 10 minutes.</p>
      </div>
      <p style="color: #9ab89a; font-size: 0.78rem;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """

    if not EMAIL_USER or not EMAIL_PASS:
        # Dev mode — print to console
        print(f"\n{'='*50}")
        print(f"[DEV MODE] OTP Email — {purpose.upper()}")
        print(f"  To:  {to_email}")
        print(f"  OTP: {otp}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_FROM, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
        # Still print OTP to console so dev can test
        print(f"[FALLBACK] OTP for {to_email}: {otp}")
        return False
