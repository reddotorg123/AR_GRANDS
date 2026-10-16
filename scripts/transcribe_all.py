import os
import glob
import subprocess
import imageio_ffmpeg
import speech_recognition as sr

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
r = sr.Recognizer()

videos = sorted(glob.glob(r'C:\Users\jagad\Videos\avatar vedio\*.mp4'))
for v in videos:
    name = os.path.basename(v).replace('.mp4', '')
    wav = f'temp_audio/{name}_full.wav'
    subprocess.run([ffmpeg, '-y', '-i', v, '-vn', '-ac', '1', '-ar', '16000', wav], stderr=subprocess.DEVNULL)
    try:
        with sr.AudioFile(wav) as source:
            audio = r.record(source)
            text = r.recognize_google(audio)
            print(f"{name} -> '{text}'")
    except Exception as e:
        print(f"{name} -> error: {e}")
