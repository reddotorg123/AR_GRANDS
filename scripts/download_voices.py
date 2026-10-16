import os
import asyncio
import edge_tts

# Using 'en-US-AnaNeural' - Microsoft's dedicated authentic child/kid voice
KID_VOICE = 'en-US-AnaNeural'

# Speeches synchronized with the kid avatar dialogues
routes = {
    "home": "Welcome to A.R. Grand! Explore our luxury halls.",
    "gallery": "Browse our grand stage settings, lighting, and decor.",
    "facilities": "Air-conditioned halls, premium dining, and private bridal suites await you.",
    "events": "Check available dates for weddings, receptions, and parties.",
    "contact": "Plan to celebrate with us. Reserve your date today.",
    "enquiry": "Step inside our 360-degree virtual tour and explore our halls.",
    "admin": "Welcome to the admin portal for managing bookings and venue operations.",
    "perambur": "Easily accessible venues across Chennai with prime city connectivity.",
    "vyasarpadi": "Easily accessible venues across Chennai with prime city connectivity.",
    "madhavaram": "Easily accessible venues across Chennai with prime city connectivity.",
    "home-about": "Located in Kodungaiyur, Chennai, with timeless elegance and modern amenities.",
    "home-stats": "Over 500 celebrations with space for up to 250 guests.",
    "home-features": "Air-conditioned halls, premium dining, and private bridal suites await you.",
    "home-tour": "Step inside our 360-degree virtual tour inside A.R. Grand.",
    "home-testimonials": "Loved by couples across Chennai with five-star reviews from real celebrations.",
    "home-cta": "Plan to celebrate your special day. Reserve your date today.",
    "terms": "Here are our complete terms and conditions which cover booking, advance, overtime, noise rules, safety, and complimentary parking."
}

# Duplicate/alias mapping to ensure any legacy references get the exact same approved voice
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

os.makedirs('public/audio', exist_ok=True)

async def generate_voice(name, text):
    out_file = f'public/audio/{name}.mp3'
    rate = '+8%' if name == 'home' else '+6%'
    communicate = edge_tts.Communicate(text, KID_VOICE, pitch='+0Hz', rate=rate)
    await communicate.save(out_file)
    print(f"Generated {out_file} (Kid Voice: {KID_VOICE})")

async def main():
    print(f"Generating kid-version voice audio clips using {KID_VOICE}...")
    for name, text in routes.items():
        await generate_voice(name, text)
    
    # Copy/alias for any avatar-* files
    import shutil
    for alias, target in aliases.items():
        src = f'public/audio/{target}.mp3'
        dst = f'public/audio/{alias}.mp3'
        if os.path.exists(src):
            shutil.copyfile(src, dst)
            print(f"Copied {src} -> {dst}")
            
    print("All kid voice clips successfully generated and unified!")

if __name__ == '__main__':
    asyncio.run(main())
