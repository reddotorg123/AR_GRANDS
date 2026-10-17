import { useState, useEffect, useRef } from "react";
import hero1 from "@/assets/hero-1.jpg";
import aboutExterior from "@/assets/about-exterior.jpg";
import logo from "@/assets/logo.png";

export default function Preloader() {
  const isQRRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/qr");
  const [progress, setProgress] = useState(0);
  const [isHiding, setIsHiding] = useState(false);
  const [isHidden, setIsHidden] = useState(
    () => isQRRoute || (typeof window !== "undefined" && !!sessionStorage.getItem("ar_grand_site_loaded"))
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetProgressRef = useRef(0);
  const allReadyRef = useRef(false);
  const videoLoadedRef = useRef(false);

  useEffect(() => {
    // Bypass if not accessing root home '/' route (e.g. /events, /gallery, /qr)
    if (window.location.pathname !== "/" && window.location.pathname !== "") {
      setIsHidden(true);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.classList.add("site-ready");
      window.dispatchEvent(new Event("preloaderFinished"));
      return;
    }

    // Prevent preloader from running repeatedly in the same session
    const alreadyLoaded = sessionStorage.getItem("ar_grand_site_loaded");
    if (alreadyLoaded) {
      setIsHidden(true);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.classList.add("site-ready");
      window.dispatchEvent(new Event("preloaderFinished"));
      return;
    }

    sessionStorage.setItem("ar_grand_site_loaded", "true");

    // --- WebGL Real-time Transparency Renderer ---
    const canvas = canvasRef.current;
    const video = videoRef.current;
    let gl: WebGLRenderingContext | null = null;
    let glTexture: WebGLTexture | null = null;
    let useWebGL = false;

    if (canvas) {
      canvas.width = 540;
      canvas.height = 960;

      try {
        gl = canvas.getContext("webgl", {
          premultipliedAlpha: true,
          alpha: true,
          antialias: true,
        });

        if (gl) {
          const vsSource = `
            attribute vec2 a_pos;
            varying vec2 v_uv;
            void main() {
              v_uv = a_pos * 0.5 + 0.5;
              v_uv.y = 1.0 - v_uv.y;
              gl_Position = vec4(a_pos, 0.0, 1.0);
            }
          `;

          const fsSource = `
            precision mediump float;
            uniform sampler2D u_tex;
            varying vec2 v_uv;
            void main() {
              vec4 col = texture2D(u_tex, v_uv);
              float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
              float maxC = max(col.r, max(col.g, col.b));
              float minC = min(col.r, min(col.g, col.b));
              float sat = maxC - minC;
              
              // Smooth transparent key for white / studio light background
              float isWhite = smoothstep(0.86, 0.95, lum) * (1.0 - smoothstep(0.04, 0.10, sat));
              float alpha = clamp(1.0 - isWhite, 0.0, 1.0);
              
              // Premultiplied alpha output for clean transparent compositing
              gl_FragColor = vec4(col.rgb * alpha, alpha);
            }
          `;

          const compileShader = (type: number, src: string) => {
            if (!gl) return null;
            const s = gl.createShader(type);
            if (!s) return null;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
          };

          const vs = compileShader(gl.VERTEX_SHADER, vsSource);
          const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

          if (vs && fs) {
            const prog = gl.createProgram();
            if (prog) {
              gl.attachShader(prog, vs);
              gl.attachShader(prog, fs);
              gl.linkProgram(prog);
              gl.useProgram(prog);

              const buf = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, buf);
              gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
              );

              const posLoc = gl.getAttribLocation(prog, "a_pos");
              gl.enableVertexAttribArray(posLoc);
              gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

              glTexture = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, glTexture);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

              gl.viewport(0, 0, canvas.width, canvas.height);
              useWebGL = true;
            }
          }
        }
      } catch {
        useWebGL = false;
      }
    }

    const renderTransparentFrame = () => {
      if (!video || video.readyState < 2) return;

      if (useWebGL && gl && glTexture) {
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (canvas) {
        // Fallback 2D Canvas Luma-Key
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const l = frame.data.length;
          for (let i = 0; i < l; i += 4) {
            const r = frame.data[i];
            const g = frame.data[i + 1];
            const b = frame.data[i + 2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            if (r > 220 && g > 220 && b > 220 && maxC - minC < 25) {
              frame.data[i + 3] = 0;
            }
          }
          ctx.putImageData(frame, 0, 0);
        }
      }
    };

    // --- COMPREHENSIVE ASSET PRELOAD ENGINE ---
    // Preloads critical above-the-fold assets, plus ALL video animations and audios
    // into browser memory/cache before loading completion to guarantee zero-latency playback.
    const criticalSiteImages = [
      hero1,
      aboutExterior,
      logo,
    ];

    const allAvatarVideos = [
      "/avatar-welcome.mp4",
      "/avatar-about.mp4",
      "/avatar-features.mp4",
      "/avatar-events.mp4",
      "/avatar-gallery.mp4",
      "/avatar-testimonials.mp4",
      "/avatar-location.mp4",
      "/avatar-cta.mp4",
      "/avatar-admin.mp4",
      "/avatar-tour.mp4",
      "/avatar-stats.mp4",
    ];

    const allAvatarAudios = [
      "/audio/home.mp3",
      "/audio/home-about.mp3",
      "/audio/home-features.mp3",
      "/audio/events.mp3",
      "/audio/gallery.mp3",
      "/audio/home-testimonials.mp3",
      "/audio/contact.mp3",
      "/audio/home-cta.mp3",
      "/audio/admin.mp3",
      "/audio/home-tour.mp3",
      "/audio/home-stats.mp3",
    ];

    let loadedCount = 0;
    // Total: fold images (3) + all avatar videos (11) + all avatar audios (11) + preloader video (1) + fonts + DOM = 28
    const totalItems = criticalSiteImages.length + allAvatarVideos.length + allAvatarAudios.length + 3;

    const checkItemLoaded = () => {
      loadedCount += 1;
      const calculatedPercent = Math.min(Math.round((loadedCount / totalItems) * 100), 100);
      targetProgressRef.current = Math.max(targetProgressRef.current, calculatedPercent);

      if (loadedCount >= totalItems) {
        allReadyRef.current = true;
        targetProgressRef.current = 100;
      }
    };

    // 1. Optimized Video Ready Handler (Preloader's own stream)
    if (video) {
      const handleVideoReady = () => {
        if (!videoLoadedRef.current) {
          videoLoadedRef.current = true;
          checkItemLoaded();
          video.play().catch(() => {});
        }
      };

      if (video.readyState >= 2) {
        handleVideoReady();
      } else {
        video.addEventListener("loadeddata", handleVideoReady, { once: true });
        video.addEventListener("canplay", handleVideoReady, { once: true });
        video.addEventListener("error", () => {
          videoLoadedRef.current = true;
          checkItemLoaded();
        }, { once: true });
      }
    } else {
      checkItemLoaded();
    }

    // 2. Preload and Decode Critical Fold Images
    criticalSiteImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      const onDone = () => checkItemLoaded();

      if (img.complete) {
        onDone();
      } else {
        img.onload = () => {
          if ("decode" in img) {
            img.decode().then(onDone).catch(onDone);
          } else {
            onDone();
          }
        };
        img.onerror = onDone;
      }
    });

    // 3. Preload ALL Video Animations into Browser HTTP / Blob Cache
    allAvatarVideos.forEach((src) => {
      fetch(src, { cache: "force-cache" })
        .then(() => checkItemLoaded())
        .catch(() => checkItemLoaded());
    });

    // 4. Preload ALL Audio Speech Tracks into Browser Cache
    allAvatarAudios.forEach((src) => {
      fetch(src, { cache: "force-cache" })
        .then(() => checkItemLoaded())
        .catch(() => checkItemLoaded());
    });

    // 5. Web Fonts Readiness
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(checkItemLoaded).catch(checkItemLoaded);
    } else {
      setTimeout(checkItemLoaded, 150);
    }

    // 6. DOM / Document Readiness
    if (document.readyState === "complete") {
      checkItemLoaded();
    } else {
      window.addEventListener("load", checkItemLoaded, { once: true });
    }

    // Fast fallback safety timeout (prevents lock on slow networks)
    const maxSafetyTimeout = setTimeout(() => {
      allReadyRef.current = true;
      targetProgressRef.current = 100;
    }, 4000);

    // --- PROGRESS INTERPOLATOR & VIDEO ANIMATION LOOP ---
    let currentDisplayProgress = 0;
    let animFrameId: number;
    let videoVisibleStartTime: number | null = null;
    let hasRenderedFirstFrame = false;
    const minNaturalDuration = 850; // Brisk and luxurious ~0.85s intro while brand animation plays

    const renderLoop = (time: number) => {
      // Check if video is ready to render
      if (video && video.readyState >= 2) {
        renderTransparentFrame();
        if (!hasRenderedFirstFrame) {
          hasRenderedFirstFrame = true;
          videoVisibleStartTime = time;
        }
      }

      // If video has not appeared yet, keep progress strictly at 0%
      if (!hasRenderedFirstFrame || videoVisibleStartTime === null) {
        setProgress(0);
        animFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      // Elapsed time since first visible frame
      const elapsed = time - videoVisibleStartTime;
      const timePacing = Math.min((elapsed / minNaturalDuration) * 98, 98);

      // Progress is strictly capped below 100 until ALL assets are loaded into memory
      const target = allReadyRef.current && elapsed >= minNaturalDuration
        ? 100
        : Math.min(targetProgressRef.current, timePacing);

      if (currentDisplayProgress < target) {
        currentDisplayProgress += Math.max(0.4, (target - currentDisplayProgress) * 0.14);
        if (currentDisplayProgress > target) currentDisplayProgress = target;

        const displayPct = Math.min(100, Math.floor(currentDisplayProgress));
        setProgress(displayPct);
      }

      // COMPLETION: All assets verified loaded AND progress at 100%
      if (allReadyRef.current && currentDisplayProgress >= 100) {
        setProgress(100);

        if (videoRef.current && !videoRef.current.paused) {
          try {
            videoRef.current.pause();
          } catch {}
        }

        setTimeout(() => {
          setIsHiding(true);
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.body.classList.add("site-ready");
          setTimeout(() => {
            setIsHidden(true);
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            window.dispatchEvent(new Event("preloaderFinished"));
          }, 650);
        }, 400);
      } else {
        animFrameId = requestAnimationFrame(renderLoop);
      }
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      clearTimeout(maxSafetyTimeout);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, []);

  if (isHidden) return null;

  return (
    <aside
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-all duration-[650ms] ease-out select-none ${
        isHiding ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        background: "radial-gradient(circle at 50% 50%, rgba(255, 248, 235, 0.96) 0%, #ece4d4 70%, #f8f4ed 100%)",
      }}
      aria-label="Website Loading Screen"
    >
      {/* Hidden Source Video Stream */}
      <video
        ref={videoRef}
        src="/final.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="hidden"
        aria-hidden="true"
      />

      {/* Luxury Ambient Lighting Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38vw] h-[38vw] max-w-[460px] max-h-[460px] rounded-full bg-[rgba(163,124,42,0.25)] blur-[45px] pointer-events-none animate-pulse"
        aria-hidden="true"
      />

      {/* Luxury Corner Filigree Accents */}
      <div className="absolute inset-4 md:inset-6 border border-[rgba(163,124,42,0.28)] opacity-35 pointer-events-none">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-[#a37c2a]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-[#a37c2a]" />
      </div>

      {/* Centered Transparent Character Stage */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 pointer-events-none">
        <section
          className="relative flex items-center justify-center w-[44vw] max-w-[280px] max-h-[50vh] md:w-[22vw] md:max-w-[320px] md:max-h-[52vh] aspect-[9/16]"
          aria-label="AR Grands Wedding Animation"
        >
          <canvas
            ref={canvasRef}
            width={540}
            height={960}
            className="w-full h-full object-contain block select-none"
            style={{
              filter: "drop-shadow(0 8px 24px rgba(163, 124, 42, 0.14))",
            }}
          >
            Your browser does not support HTML5 Canvas.
          </canvas>
        </section>
      </div>

      {/* Bold Corner Percentage (Right Bottom Corner, ~10% screen, Roboto Font) */}
      <div
        className="fixed right-[4vw] bottom-[3vh] z-[10000] font-black text-[#a37c2a] leading-none tracking-tight select-none pointer-events-none"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: "clamp(3.5rem, 9.5vw, 11vh)",
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 4px 18px rgba(163, 124, 42, 0.28)",
        }}
        aria-live="polite"
      >
        {progress}%
      </div>
    </aside>
  );
}
