import glob
import os
import speech_recognition as sr

r = sr.Recognizer()

files = sorted(glob.glob('temp_audio/*_raw.wav'))
print(f"Found {len(files)} files to transcribe...")

for f in files:
    name = os.path.basename(f)
    try:
        with sr.AudioFile(f) as source:
            audio = r.record(source)
            text = r.recognize_google(audio)
            print(f"{name} -> '{text}'")
    except Exception as e:
        print(f"{name} -> error: {e}")
