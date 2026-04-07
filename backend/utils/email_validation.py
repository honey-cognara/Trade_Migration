"""
Email validation utilities.
- Blocks known dummy/disposable/test domains
- Verifies the domain has real MX DNS records
"""

import asyncio
import dns.resolver
import dns.exception

# ── Blocked domains (test, disposable, example-only) ─────────────────────────
BLOCKED_DOMAINS = {
    # generic test/placeholder
    "test.com", "test.org", "test.net", "test.io",
    "example.com", "example.org", "example.net",
    "fake.com", "fake.org", "dummy.com", "dummy.org",
    "invalid.com", "noreply.com", "no-reply.com",
    "placeholder.com", "temp.com",
    # well-known disposable / throw-away services
    "mailinator.com", "guerrillamail.com", "guerrillamail.org",
    "guerrillamail.net", "guerrillamail.de", "guerrillamail.info",
    "tempmail.com", "temp-mail.org", "throwam.com",
    "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "dispostable.com", "maildrop.cc", "trashmail.com",
    "trashmail.me", "trashmail.net", "trashmail.at",
    "trashmail.io", "trashmail.org", "trash-mail.at",
    "yopmail.com", "yopmail.fr", "yopmail.net",
    "cool.fr.nf", "jetable.fr.nf", "spam.la",
    "spamgourmet.com", "spamgourmet.net",
    "getairmail.com", "filzmail.com",
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "20minutemail.com", "20minutemail.it",
    "mintemail.com", "spamfree24.org",
    "mailnull.com", "spammotel.com",
    "spamex.com", "spaml.com",
    "gishpuppy.com", "mailexpire.com",
    "spamcannon.com", "spamcannon.net",
    "binkmail.com", "bobmail.info",
    "chammy.info", "devnullmail.com",
    "discard.email", "discardmail.com", "discardmail.de",
    "dodgeit.com", "dodgit.com",
    "dumpandfuck.com", "e4ward.com",
    "ephemail.net", "fastacura.com",
    "fastem.com", "fastemail.us",
    "fastemailer.com", "fastinbox.com",
    "fastmazda.com", "fastnissan.com",
    "fastsuzuki.com", "fasttoyota.com",
    "fastyamaha.com", "filzmail.de",
    "fixmail.tk", "fizmail.com",
    "fr33mail.info", "frapmail.com",
    "garliclife.com", "get2mail.fr",
    "getonemail.com", "getonemail.net",
    "girlsundertheinfluence.com", "gishpuppy.com",
    "haltospam.com", "hatespam.org",
    "hidemail.de", "hotpop.com",
    "ieatspam.eu", "ieatspam.info",
    "ihateyoualot.info", "iheartspam.org",
    "inoutmail.de", "inoutmail.eu",
    "inoutmail.info", "inoutmail.net",
    "ipoo.org", "irish2me.com",
    "jetable.com", "jetable.fr.nf",
    "jetable.net", "jetable.org",
    "junk1.tk", "kasmail.com",
    "klassmaster.com", "klassmaster.net",
    "letthemeatspam.com", "lovemeleaveme.com",
    "lukemail.com", "lol.ovpn.to",
    "maileater.com", "mailexpire.com",
    "mailforspam.com", "mailin8r.com",
    "mailme.ir", "mailme24.com",
    "mailmetrash.com", "mailmoat.com",
    "mailnew.com", "mailnull.com",
    "mailshell.com", "mailsiphon.com",
    "mailslite.com", "mailtrash.net",
    "mailzilla.com", "mailzilla.org",
    "mega.zik.dj", "meltmail.com",
    "mierdamail.com", "mintemail.com",
    "moburl.com", "moncourrier.fr.nf",
    "monemail.fr.nf", "monmail.fr.nf",
    "mt2009.com", "myspamless.com",
    "neomailbox.com", "nepwk.com",
    "nervmich.net", "nervtmich.net",
    "netmails.com", "netmails.net",
    "nobulk.com", "noclickemail.com",
    "nodezine.com", "nogmailspam.info",
    "nomail.pw", "nomail.xl.cx",
    "nomail2me.com", "nomorespamemails.com",
    "nonspam.eu", "nonspammer.de",
    "noref.in", "nospam.ze.tc",
    "nospam4.us", "nospamfor.us",
    "nospamthanks.info", "notmailinator.com",
    "nowmymail.com", "nowhere.org",
    "obobbo.com", "odnorazovoe.ru",
    "oneoffemail.com", "onewaymail.com",
    "online.ms", "oopi.org",
    "opentrash.com", "owlpic.com",
    "pookmail.com", "privacy.net",
    "proxymail.eu", "prtnx.com",
    "punkass.com", "PutThisInYourSpamDatabase.com",
    "qq.com",
    "rklips.com", "rmqkr.net",
    "ro.lt", "rotaniliam.com",
    "s0ny.net", "safe-mail.net",
    "safetymail.info", "sandelf.de",
    "sast.ro", "saynotospams.com",
    "schafmail.de", "schrott-email.de",
    "secretemail.de", "secure-mail.biz",
    "sendspamhere.com", "sharklasers.com",
    "shieldemail.com", "shiftmail.com",
    "shitmail.me", "shitmail.org",
    "shortmail.net", "sibmail.com",
    "skeefmail.com", "slopsbox.com",
    "slushmail.com", "smashmail.de",
    "smellfear.com", "snakemail.com",
    "sneakemail.com", "snkmail.com",
    "sofort-mail.de", "sogetthis.com",
    "soodonims.com", "spam.la",
    "spam.su", "spamavert.com",
    "spambob.com", "spambob.net",
    "spambob.org", "spambog.com",
    "spambog.de", "spambog.ru",
    "spambox.info", "spambox.irishspringrealty.com",
    "spambox.us", "spamcero.com",
    "spamcon.org", "spamcowboy.com",
    "spamcowboy.net", "spamcowboy.org",
    "spamday.com", "spamex.com",
    "spamfree.eu", "spamfree24.de",
    "spamfree24.eu", "spamfree24.info",
    "spamfree24.net", "spamfree24.org",
    "spamgourmet.com", "spamgourmet.net",
    "spamgourmet.org", "spamherelots.com",
    "spamhereplease.com", "spamhole.com",
    "spamify.com", "spaminmotion.com",
    "spamkill.info", "spaml.de",
    "spammotel.com", "spammy.host",
    "spamoff.de", "spamslicer.com",
    "spamspot.com", "spamstack.net",
    "spamthis.co.uk", "spamthisplease.com",
    "spamtrail.com", "speed.1s.fr",
    "supergreatmail.com", "supermailer.jp",
    "superrito.com", "superstachel.de",
    "suremail.info", "sweetxxx.de",
    "tafmail.com", "tagyourself.com",
    "talkinator.com", "teleworm.com",
    "teleworm.us", "tempalias.com",
    "tempe-mail.com", "tempemail.biz",
    "tempemail.co.za", "tempemail.com",
    "tempemail.net", "tempinbox.co.uk",
    "tempinbox.com", "tempmaildemo.com",
    "tempmailer.com", "tempmailer.de",
    "tempomail.fr", "temporaryemail.net",
    "temporaryemail.us", "temporaryforwarding.com",
    "temporaryinbox.com", "temporarymail.org",
    "tempthe.net", "thankyou2010.com",
    "thecloudindex.com", "theinternetemail.com",
    "thelimestones.com", "thenulls.com",
    "tittbit.in", "tizi.com",
    "tmailinator.com", "toiea.com",
    "tradermail.info", "trash-amil.com",
    "trash-mail.com", "trash2009.com",
    "trash2010.com", "trash2011.com",
    "trashdevil.com", "trashdevil.de",
    "trashemail.de", "trashimail.de",
    "trashmail.at", "trashmail.com",
    "trashmail.io", "trashmail.me",
    "trashmail.net", "trashmail.org",
    "trashmailer.com", "trashymail.com",
    "trbvm.com", "trgvo.com",
    "turual.com", "twinmail.de",
    "tyldd.com", "uggsrock.com",
    "umail.net", "uroid.com",
    "us.af", "venompen.com",
    "veryrealemail.com", "vidchart.com",
    "viditag.com", "viralplays.com",
    "vpn.st", "vsimcard.com",
    "vubby.com", "wasteland.rfc822.org",
    "webemail.me", "webm4il.info",
    "wegwerfmail.de", "wegwerfmail.net",
    "wegwerfmail.org", "wh4f.org",
    "whyspam.me", "willhackforfood.biz",
    "willselfdestruct.com", "wilemail.com",
    "wmboxy.com", "wolfmail.ml",
    "wollan.info", "writeme.us",
    "wronghead.com", "wuzupmail.net",
    "www.e4ward.com", "www.mailinator.com",
    "xagloo.com", "xemaps.com",
    "xents.com", "xmaily.com",
    "xoxy.net", "xyzfree.net",
    "yapped.net", "yeah.net",
    "yep.it", "yogamaven.com",
    "yopmail.com", "yopmail.fr",
    "youmail.ga", "yourlms.biz",
    "zaun.co", "zehnminuten.de",
    "zehnminutenmail.de", "zetmail.com",
    "zippymail.info", "zoemail.com",
    "zoemail.net", "zoemail.org",
    "zomg.info",
}


def _check_mx_sync(domain: str) -> bool:
    """Return True if domain has at least one MX record."""
    try:
        answers = dns.resolver.resolve(domain, "MX", lifetime=5)
        return len(answers) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer,
            dns.resolver.NoNameservers, dns.exception.Timeout):
        return False
    except Exception:
        return False


async def validate_email_domain(email: str) -> tuple[bool, str]:
    """
    Returns (is_valid, error_message).
    Checks:
      1. Domain is not in the blocked/disposable list
      2. Domain has real MX DNS records
    """
    try:
        domain = email.split("@")[1].lower().strip()
    except IndexError:
        return False, "Invalid email format."

    # 1. Blocklist check
    if domain in BLOCKED_DOMAINS:
        return False, "Please use a real email address. Disposable or test email addresses are not allowed."

    # 2. MX record check (run in thread to avoid blocking async loop)
    loop = asyncio.get_event_loop()
    has_mx = await loop.run_in_executor(None, _check_mx_sync, domain)

    if not has_mx:
        return False, f"The email domain '{domain}' does not appear to be valid. Please use a real email address."

    return True, ""
