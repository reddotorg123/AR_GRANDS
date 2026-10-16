import os
import av

def slice_video(src_path, dst_path, start_sec, end_sec, target_fps=24):
    print(f"Generating {os.path.basename(dst_path)} from {start_sec}s to {end_sec}s...")
    inp = av.open(src_path)
    in_stream = inp.streams.video[0]
    
    out = av.open(dst_path, 'w')
    fps = target_fps or int(in_stream.average_rate)
    out_stream = out.add_stream('libx264', rate=fps)
    out_stream.width = in_stream.width
    out_stream.height = in_stream.height
    out_stream.pix_fmt = 'yuv420p'
    out_stream.options = {'crf': '19', 'preset': 'fast'}

    src_fps = float(in_stream.average_rate)
    start_frame = int(start_sec * src_fps)
    end_frame = int(end_sec * src_fps)

    f_idx = 0
    for frame in inp.decode(in_stream):
        if start_frame <= f_idx <= end_frame:
            for packet in out_stream.encode(frame):
                out.mux(packet)
        f_idx += 1
        if f_idx > end_frame:
            break
            
    for packet in out_stream.encode():
        out.mux(packet)
        
    out.close()
    inp.close()
    print(f"Created {dst_path} ({os.path.getsize(dst_path)} bytes)")

public_dir = r"D:\AR GRANDS WEBSITE\argrand-venue-showcase\public"
master_boy2 = os.path.join(public_dir, "boy animation2.mp4")
master_dance = os.path.join(public_dir, "avatar-dance.mp4")

# Slices from master_boy2 (10s):
# 1. Front Standing Welcome & Open Palm (custom green-screen avatar animation provided by user)
# slice_video(master_boy2, os.path.join(public_dir, "avatar-welcome.mp4"), 7.4, 10.0)

# 2. Forward Jogging / Brisk Cheerful Approach (5.2s - 7.5s)
slice_video(master_boy2, os.path.join(public_dir, "avatar-approach.mp4"), 5.2, 7.5)

# 3. Turning from Side Profile to Front (3.0s - 5.4s)
slice_video(master_boy2, os.path.join(public_dir, "avatar-turn-front.mp4"), 3.0, 5.4)

# 4. Profile Gentle Walking Stroll (0.0s - 3.2s)
slice_video(master_boy2, os.path.join(public_dir, "avatar-side-walk.mp4"), 0.0, 3.2)

# 5. Walk in Profile into Front Turn (0.0s - 5.2s)
slice_video(master_boy2, os.path.join(public_dir, "avatar-walk-and-turn.mp4"), 0.0, 5.2)

# 6. Forward Approach & Welcome Greeting (5.2s - 9.8s)
slice_video(master_boy2, os.path.join(public_dir, "avatar-approach-and-greet.mp4"), 5.2, 9.8)

# 7. Calm Smiling Front Pose (8.4s - 10.0s) - perfect for resting idle
slice_video(master_boy2, os.path.join(public_dir, "avatar-calm-nod.mp4"), 8.4, 10.0)

# Slices from master_dance (5.28s):
# 8. Rhythmic Celebration Dance Groove (0.0s - 2.5s)
slice_video(master_dance, os.path.join(public_dir, "avatar-dance-groove.mp4"), 0.0, 2.5, target_fps=25)

# 9. Joyful Victory Crouch & High Leap Jump (2.5s - 5.2s)
slice_video(master_dance, os.path.join(public_dir, "avatar-dance-jump.mp4"), 2.5, 5.2, target_fps=25)

print("All avatar motion clips successfully generated!")
