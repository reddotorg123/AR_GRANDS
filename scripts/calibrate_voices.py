import os
import asyncio
import subprocess
import shutil
import edge_tts
import imageio_ffmpeg

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
KID_VOICE = 'en-US-AnaNeural'

# EXACT speech texts and lip-sync timings calibrated to the 3D animated mouth models
calibration = {
    "home": {
        "text": "Welcome to A.R. Grand! Explore our luxury halls.",
        "pre_delay": 0.35,
        "rate": "+4%",
    },
    "home-about": {
        "text": "Timeless elegance in Kodungaiyur, crafted for your special day.",
        "pre_delay": 0.10,
        "rate": "+3%",
    },
    "home-stats": {
        "text": "Over 500 celebrations with seating for 250 guests.",
        "pre_delay": 2.22,
        "rate": "+2%",
    },
    "home-features": {
        "text": "Air-conditioned halls, premium dining, and private bridal suites await you.",
        "pre_delay": 2.16,
        "rate": "+4%",
    },
    "home-tour": {
        "text": "Step inside and take a 360 virtual tour.",
        "pre_delay": 2.58,
        "rate": "+3%",
    },
    "home-testimonials": {
        "text": "Loved by hundreds of happy families across Chennai.",
        "pre_delay": 4.46,
        "rate": "+4%",
    },
    "home-cta": {
        "text": "Ready to celebrate? Book your dream date today.",
        "pre_delay": 1.16,
        "rate": "+2%",
    },
    "gallery": {
        "text": "Browse our grand stage settings, lighting, and decor.",
        "pre_delay": 0.74,
        "rate": "+4%",
    },
    "events": {
        "text": "Check available dates for weddings, receptions, and parties.",
        "pre_delay": 0.72,
        "rate": "+4%",
    },
    "admin": {
        "text": "Welcome manager, please sign in to access bookings.",
        "pre_delay": 0.64,
        "rate": "+5%",
    },
    "perambur": {
        "text": "Easily accessible venues across North Chennai with ample parking.",
        "pre_delay": 0.68,
        "rate": "+3%",
    },
    "vyasarpadi": {
        "text": "Easily accessible venues across North Chennai with ample parking.",
        "pre_delay": 0.68,
        "rate": "+3%",
    },
    "madhavaram": {
        "text": "Easily accessible venues across North Chennai with ample parking.",
        "pre_delay": 0.68,
        "rate": "+3%",
    },
    "facilities": {
        "text": "Air-conditioned halls, premium dining, and private bridal suites await you.",
        "pre_delay": 2.16,
        "rate": "+4%",
    },
    "contact": {
        "text": "Ready to celebrate? Book your dream date today.",
        "pre_delay": 1.16,
        "rate": "+2%",
    },
    "enquiry": {
        "text": "Step inside and take a 360 virtual tour.",
        "pre_delay": 2.58,
        "rate": "+3%",
    }
}

os.makedirs('temp_audio', exist_ok=True)
os.makedirs('public/audio', exist_ok=True)

async def calibrate_audio(name, cfg):
    raw_mp3 = f"temp_audio/{name}_raw_calib.mp3"
    calibrated_mp3 = f"public/audio/{name}.mp3"
    
    # 1. Generate clean voice with edge-tts using approved kid voice
    comm = edge_tts.Communicate(cfg["text"], KID_VOICE, pitch='+0Hz', rate=cfg["rate"])
    await comm.save(raw_mp3)
    
    # 2. Add calibrated pre_delay silence using ffmpeg adelay filter
    delay_ms = int(cfg["pre_delay"] * 1000)
    cmd = [
        ffmpeg, '-y', '-i', raw_mp3,
        '-af', f'adelay={delay_ms}|{delay_ms}',
        '-b:a', '192k',
        calibrated_mp3
    ]
    subprocess.run(cmd, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    print(f"Generated {calibrated_mp3}: pre_delay={delay_ms}ms, rate={cfg['rate']}")

async def main():
    print(f"Generating exact lip-synced audio files with {KID_VOICE}...")
    for name, cfg in calibration.items():
        await calibrate_audio(name, cfg)
        
    aliases = {
        "avatar-boy-jumping-welcome": "home",
        "avatar-about": "home-about",
        "avatar-stats": "home-stats",
        "avatar-features": "home-features",
        "avatar-tour": "home-tour",
        "avatar-testimonials": "home-testimonials",
        "avatar-cta": "home-cta",
        "avatar-gallery": "gallery",
        "avatar-events": "events",
        "avatar-admin": "admin",
        "avatar-location": "perambur",
    }
    for alias, target in aliases.items():
        src = f"public/audio/{target}.mp3"
        dst = f"public/audio/{alias}.mp3"
        if os.path.exists(src):
            shutil.copyfile(src, dst)
            print(f"Copied alias {src} -> {dst}")
            
    print("ALL EXACT LIP-SYNCED ASSETS READY!")

if __name__ == '__main__':
    asyncio.run(main())
