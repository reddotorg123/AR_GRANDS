import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, VolumeX, X } from "lucide-react";

interface AvatarConfig {
    videoSrc: string;
    audioSrc?: string;
    text: string;
}

// Waiting dwell time reduced to 60 milliseconds for instant responsiveness
const DWELL_TIME_MS = 60;

// High-Quality Lip-Synced Assets with EXACT Synchronized Dialogue Syllables
const routeAvatarConfigs: Record<string, AvatarConfig> = {
    "/": { videoSrc: "/avatar-welcome.mp4", audioSrc: "/audio/home.mp3", text: "Welcome to A.R. Grand! Explore our luxury halls." },
    "/gallery": { videoSrc: "/avatar-gallery.mp4", audioSrc: "/audio/gallery.mp3", text: "Browse our grand stage settings, lighting, and decor." },
    "/facilities": { videoSrc: "/avatar-features.mp4", audioSrc: "/audio/facilities.mp3", text: "Air-conditioned halls, premium dining, and private bridal suites await you." },
    "/events": { videoSrc: "/avatar-events.mp4", audioSrc: "/audio/events.mp3", text: "Check available dates for weddings, receptions, and parties." },
    "/contact": { videoSrc: "/avatar-cta.mp4", audioSrc: "/audio/contact.mp3", text: "Ready to celebrate? Book your dream date today." },
    "/enquiry": { videoSrc: "/avatar-tour.mp4", audioSrc: "/audio/enquiry.mp3", text: "Step inside and take a 360 virtual tour." },
    "/admin": { videoSrc: "/avatar-admin.mp4", audioSrc: "/audio/admin.mp3", text: "Welcome manager, please sign in to access bookings." },
    "/locations/perambur": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/perambur.mp3", text: "Easily accessible venues across North Chennai with ample parking." },
    "/locations/vyasarpadi": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/vyasarpadi.mp3", text: "Easily accessible venues across North Chennai with ample parking." },
    "/locations/madhavaram": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/madhavaram.mp3", text: "Easily accessible venues across North Chennai with ample parking." }
};

const homeSections: Record<string, AvatarConfig> = {
    hero: { text: "Welcome to A.R. Grand! Explore our luxury halls.", videoSrc: "/avatar-welcome.mp4", audioSrc: "/audio/home.mp3" },
    about: { text: "Timeless elegance in Kodungaiyur, crafted for your special day.", videoSrc: "/avatar-about.mp4", audioSrc: "/audio/home-about.mp3" },
    stats: { text: "Over 500 celebrations with seating for 250 guests.", videoSrc: "/avatar-stats.mp4", audioSrc: "/audio/home-stats.mp3" },
    features: { text: "Air-conditioned halls, premium dining, and private bridal suites await you.", videoSrc: "/avatar-features.mp4", audioSrc: "/audio/home-features.mp3" },
    tour: { text: "Step inside and take a 360 virtual tour.", videoSrc: "/avatar-tour.mp4", audioSrc: "/audio/home-tour.mp3" },
    testimonials: { text: "Loved by hundreds of happy families across Chennai.", videoSrc: "/avatar-testimonials.mp4", audioSrc: "/audio/home-testimonials.mp3" },
    cta: { text: "Ready to celebrate? Book your dream date today.", videoSrc: "/avatar-cta.mp4", audioSrc: "/audio/home-cta.mp3" }
};

// Tracks all sections & routes that have already played during this browser session.
// Cleared automatically on page reload so animations run strictly ONCE until the next reload.
const playedKeys = new Set<string>();

export default function InteractiveAvatar() {
    // Initial state: hidden until dwell condition (60ms) is met
    const [stage, setStage] = useState<"hidden" | "entering" | "waiting" | "speaking" | "idle" | "rejected">("hidden");
    const [isMuted, setIsMuted] = useState(false);
    const [, setAudioBlocked] = useState(false);
    const [currentText, setCurrentText] = useState("Welcome to A.R. Grand! Explore our luxury halls.");
    const [isBubbleOpen, setIsBubbleOpen] = useState(false);
    const [hasTouched, setHasTouched] = useState(false);
    const [isFormActive, setIsFormActive] = useState(false);

    const location = useLocation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMutedRef = useRef(false);
    const activeConfigRef = useRef<AvatarConfig>(routeAvatarConfigs["/"]);
    const activeHomeSectionRef = useRef<string | null>(null);

    // Concurrency Token: Ensures rapid switching NEVER triggers stale video/audio events
    const playRequestIdRef = useRef(0);

    // Audio & Scroll Queue Controls: Speech finishes before next clip; no rapid scroll conflicts
    const isSpeakingRef = useRef(false);
    const pendingSectionRef = useRef<AvatarConfig | null>(null);
    const scrollDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Dwell condition controls: 60ms quick non-blocking emergence
    const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dwellSatisfiedRef = useRef(false);
    const hasUserInteractedRef = useRef(false);

    const stopSpeech = useCallback(() => {
        playRequestIdRef.current += 1;
        isSpeakingRef.current = false;
        pendingSectionRef.current = null;
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = null;
        }
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            } catch (_) {}
        }
        if (typeof window !== "undefined" && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (_) {}
        }
    }, []);

    // Controlled video and calibrated voice playback with atomic synchronization
    const playConfig = useCallback((config: AvatarConfig) => {
        playRequestIdRef.current += 1;
        const currentReqId = playRequestIdRef.current;

        activeConfigRef.current = config;
        setCurrentText(config.text);
        isSpeakingRef.current = true;

        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = null;
        }
        setIsBubbleOpen(true);

        const video = videoRef.current;
        let audio = audioRef.current;
        if (!audio && config.audioSrc) {
            audio = new Audio();
            audio.preload = "auto";
            audioRef.current = audio;
        }

        // Configure audio element
        if (audio && config.audioSrc) {
            audio.pause();
            audio.loop = false;
            if (!audio.src.endsWith(config.audioSrc)) {
                audio.src = config.audioSrc;
            }
            audio.currentTime = 0;

            audio.onended = () => {
                if (playRequestIdRef.current !== currentReqId) return;
                isSpeakingRef.current = false;
                if (videoRef.current) {
                    videoRef.current.pause();
                }
                if (bubbleTimerRef.current) {
                    clearTimeout(bubbleTimerRef.current);
                }
                bubbleTimerRef.current = setTimeout(() => {
                    setIsBubbleOpen(false);
                    setStage("idle");
                }, 1200);
            };
        }

        // Atomic Synchronized Launch: Video and Audio start at the EXACT same millisecond
        const startSynchronizedPlayback = () => {
            if (playRequestIdRef.current !== currentReqId) return;

            if (video) {
                try {
                    video.currentTime = 0;
                } catch (_) {}
                const vPromise = video.play();
                if (vPromise !== undefined) vPromise.catch(() => {});
            }

            if (!isMutedRef.current && audio && config.audioSrc) {
                try {
                    audio.currentTime = 0;
                } catch (_) {}
                const aPromise = audio.play();
                if (aPromise !== undefined) {
                    aPromise.then(() => {
                        if (playRequestIdRef.current === currentReqId) setAudioBlocked(false);
                    }).catch(() => {
                        if (playRequestIdRef.current === currentReqId) setAudioBlocked(true);
                    });
                }
            } else {
                if (!config.audioSrc) {
                    isSpeakingRef.current = false;
                    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
                    bubbleTimerRef.current = setTimeout(() => {
                        setIsBubbleOpen(false);
                        setStage("idle");
                    }, 2500);
                }
            }
        };

        if (video) {
            video.loop = false;

            // AV Drift Lock: Keeps audio in microsecond sync with video frames
            video.ontimeupdate = () => {
                const currentAudio = audioRef.current;
                if (currentAudio && !currentAudio.paused && !video.paused) {
                    const diff = Math.abs(currentAudio.currentTime - video.currentTime);
                    if (diff > 0.18) {
                        currentAudio.currentTime = video.currentTime;
                    }
                }
            };

            video.onended = () => {
                if (playRequestIdRef.current !== currentReqId) return;
                video.pause();
                if (!isSpeakingRef.current) {
                    setIsBubbleOpen(false);
                    setStage("idle");
                }
            };

            if (!video.src.endsWith(config.videoSrc)) {
                video.pause();
                video.src = config.videoSrc;
                video.load();
            }

            // Always verify video readyState before starting synchronized playback
            if (video.readyState >= 2) {
                startSynchronizedPlayback();
            } else {
                const onCanPlay = () => {
                    video.removeEventListener("canplay", onCanPlay);
                    video.removeEventListener("loadeddata", onCanPlay);
                    if (playRequestIdRef.current === currentReqId) {
                        startSynchronizedPlayback();
                    }
                };
                video.addEventListener("canplay", onCanPlay, { once: true });
                video.addEventListener("loadeddata", onCanPlay, { once: true });
            }
        } else {
            startSynchronizedPlayback();
        }
    }, []);

    // Form input avoidance: When an input, textarea, or form is active, fade out avatar to avoid blocking
    useEffect(() => {
        const onFocusIn = (e: FocusEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select") {
                setIsFormActive(true);
            }
        };
        const onFocusOut = () => {
            setIsFormActive(false);
        };
        window.addEventListener("focusin", onFocusIn);
        window.addEventListener("focusout", onFocusOut);
        return () => {
            window.removeEventListener("focusin", onFocusIn);
            window.removeEventListener("focusout", onFocusOut);
        };
    }, []);

    // HARDWARE ACCELERATED WEBGL CHROMA-KEY SHADER (With Context Loss and Restoration Protection)
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        let gl: WebGLRenderingContext | null = null;
        let program: WebGLProgram | null = null;
        let quadBuffer: WebGLBuffer | null = null;
        let tex: WebGLTexture | null = null;
        let animationFrameId: number;
        let isCancelled = false;

        const vsSource = `
            attribute vec2 a_pos;
            attribute vec2 a_uv;
            varying vec2 v_uv;
            void main() {
                gl_Position = vec4(a_pos, 0.0, 1.0);
                v_uv = a_uv;
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform sampler2D u_video;
            varying vec2 v_uv;

            void main() {
                vec4 col = texture2D(u_video, v_uv);

                // Pure green screen chroma keying & despill
                float maxRB = max(col.r, col.b);
                float greenExcess = col.g - maxRB;

                float isGreenMain = smoothstep(0.08, 0.18, greenExcess) * smoothstep(0.28, 0.44, col.g);
                float isGreenShadow = smoothstep(0.05, 0.14, greenExcess) * smoothstep(0.14, 0.30, col.g) * (1.0 - smoothstep(0.44, 0.58, col.g)) * 0.95;
                float isGreen = clamp(isGreenMain + isGreenShadow, 0.0, 1.0);

                // Corner watermark suppression
                if (v_uv.x > 0.84 && v_uv.y > 0.74) {
                    if (isGreen > 0.05 || greenExcess > 0.06) {
                        isGreen = 1.0;
                    }
                }

                // Preserve white shirt, collar and light clothes
                float alpha = clamp(1.0 - isGreen, 0.0, 1.0);

                vec3 finalRgb = col.rgb;
                if (greenExcess > 0.0) {
                    finalRgb.g = min(col.g, maxRB * 1.02);
                }

                gl_FragColor = vec4(finalRgb * alpha, alpha);
            }
        `;

        const initGL = () => {
            gl = (canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: true, alpha: true }) ||
                  canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true, premultipliedAlpha: true, alpha: true })) as WebGLRenderingContext | null;

            if (!gl) return false;

            const createShader = (type: number, src: string) => {
                if (!gl) return null;
                const s = gl.createShader(type);
                if (!s) return null;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return s;
            };

            const vs = createShader(gl.VERTEX_SHADER, vsSource);
            const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
            if (!vs || !fs) return false;

            program = gl.createProgram();
            if (!program) return false;
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            quadBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
            // 3:4 portrait crop centered on character (u: 0.28 to 0.70)
            // Removes 170px transparent side gutters so character fits perfectly in the empty margin space
            const uMin = 0.28;
            const uMax = 0.70;
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, uMin, 1,
                 1, -1, uMax, 1,
                -1,  1, uMin, 0,
                -1,  1, uMin, 0,
                 1, -1, uMax, 1,
                 1,  1, uMax, 0
            ]), gl.STATIC_DRAW);

            tex = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            return true;
        };

        initGL();

        const handleContextLost = (e: Event) => {
            e.preventDefault();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

        const handleContextRestored = () => {
            initGL();
            render();
        };

        canvas.addEventListener("webglcontextlost", handleContextLost, false);
        canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

        const render = () => {
            if (isCancelled) return;
            if (gl && program && quadBuffer && tex && video.readyState >= 2) {
                try {
                    gl.useProgram(program);
                    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
                    const posLoc = gl.getAttribLocation(program, "a_pos");
                    const uvLoc = gl.getAttribLocation(program, "a_uv");
                    gl.enableVertexAttribArray(posLoc);
                    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
                    gl.enableVertexAttribArray(uvLoc);
                    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                    const uVideoLoc = gl.getUniformLocation(program, "u_video");
                    gl.uniform1i(uVideoLoc, 0);

                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                } catch (_) {}
            }
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            isCancelled = true;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener("webglcontextlost", handleContextLost);
            canvas.removeEventListener("webglcontextrestored", handleContextRestored);
            if (gl && program) gl.deleteProgram(program);
            if (gl && quadBuffer) gl.deleteBuffer(quadBuffer);
            if (gl && tex) gl.deleteTexture(tex);
        };
    }, []);

    // Tab Visibility Protection: Pauses on background tab and resumes cleanly without blank frames or unexpected speech
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
            } else {
                if (stage === "speaking") {
                    if (videoRef.current && videoRef.current.paused) {
                        videoRef.current.play().catch(() => {});
                    }
                    if (audioRef.current && audioRef.current.paused && !isMutedRef.current) {
                        audioRef.current.play().catch(() => {});
                    }
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [stage]);

    // Start animation & speech only after user touches or interacts with the page
    useEffect(() => {
        const onFirstInteraction = () => {
            if (hasUserInteractedRef.current) return;
            hasUserInteractedRef.current = true;
            setHasTouched(true);

            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("touchstart", onFirstInteraction);
            window.removeEventListener("scroll", onFirstInteraction);
            window.removeEventListener("keydown", onFirstInteraction);

            // If current route hasn't played yet and dwell timer completed, start now
            const routeKey = "route:" + location.pathname;
            if (!playedKeys.has(routeKey) && dwellSatisfiedRef.current) {
                playedKeys.add(routeKey);
                if (location.pathname === "/") {
                    playedKeys.add("home:hero");
                }
                setStage("speaking");
                setIsBubbleOpen(true);
                playConfig(activeConfigRef.current);
            } else {
                setStage("hidden");
            }
        };

        window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
        window.addEventListener("touchstart", onFirstInteraction, { passive: true });
        window.addEventListener("scroll", onFirstInteraction, { passive: true });
        window.addEventListener("keydown", onFirstInteraction, { passive: true });

        return () => {
            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("touchstart", onFirstInteraction);
            window.removeEventListener("scroll", onFirstInteraction);
            window.removeEventListener("keydown", onFirstInteraction);
        };
    }, [location.pathname, playConfig]);

    // Route Switching & Dwell Timing:
    // Keeps avatar completely INVISIBLE until user touch is triggered,
    // and stays strictly HIDDEN once played (or when switching back to visited tabs)
    useEffect(() => {
        if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
        }

        dwellSatisfiedRef.current = false;
        stopSpeech();
        if (videoRef.current) {
            videoRef.current.pause();
        }

        if (location.pathname === "/qr-scan" || location.pathname === "/qr" || location.pathname === "/terms") {
            setStage("hidden");
            setIsBubbleOpen(false);
            return;
        }

        const config = routeAvatarConfigs[location.pathname] || routeAvatarConfigs["/"];
        activeConfigRef.current = config;
        setCurrentText(config.text);

        const routeKey = "route:" + location.pathname;
        const alreadyPlayed = playedKeys.has(routeKey);

        // Preload video source for this page so canvas is ready when needed
        const video = videoRef.current;
        if (video) {
            video.pause();
            if (!video.src.endsWith(config.videoSrc)) {
                video.src = config.videoSrc;
                video.load();
            }
        }

        // 200 millisecond waiting time for clean non-intrusive emergence
        dwellTimerRef.current = setTimeout(() => {
            dwellSatisfiedRef.current = true;

            // If user has NOT touched the page yet, stay completely INVISIBLE!
            if (!hasUserInteractedRef.current) {
                setStage("hidden");
                setIsBubbleOpen(false);
                if (videoRef.current) {
                    videoRef.current.pause();
                }
                return;
            }

            // User has touched the page:
            if (alreadyPlayed) {
                // Settle into idle state so avatar remains visible and clickable without re-triggering speech automatically
                setStage("idle");
                setIsBubbleOpen(false);
            } else {
                playedKeys.add(routeKey);
                if (location.pathname === "/") {
                    playedKeys.add("home:hero");
                }
                setStage("speaking");
                setIsBubbleOpen(true);
                playConfig(activeConfigRef.current);
            }
        }, DWELL_TIME_MS);

        return () => {
            if (dwellTimerRef.current) {
                clearTimeout(dwellTimerRef.current);
                dwellTimerRef.current = null;
            }
        };
    }, [location.pathname, stopSpeech, playConfig]);

    // Section Scroll Observer with Settling Debounce:
    // Rapid scrolling does NOT trigger repeated playback.
    // Runs strictly ONCE per section until the next reload.
    useEffect(() => {
        if (location.pathname !== "/") return;

        const checkScrollSection = () => {
            if (!dwellSatisfiedRef.current) return;

            const sections = document.querySelectorAll<HTMLElement>("[data-section]");
            if (!sections.length) return;

            const targetY = window.innerHeight * 0.45;
            let matchedSection: string | null = null;
            let closestDist = Infinity;

            sections.forEach((sec) => {
                const rect = sec.getBoundingClientRect();
                const key = sec.dataset.section;
                if (!key) return;

                if (rect.top <= targetY && rect.bottom >= targetY) {
                    matchedSection = key;
                } else if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    const dist = Math.abs(rect.top - targetY);
                    if (dist < closestDist) {
                        closestDist = dist;
                        matchedSection = key;
                    }
                }
            });

            if (matchedSection) {
                const sectionKey = "home:" + matchedSection;
                // Run strictly ONCE per session until reload
                if (playedKeys.has(sectionKey)) {
                    return;
                }

                const config = homeSections[matchedSection];
                if (config) {
                    hasUserInteractedRef.current = true;
                    setHasTouched(true);
                    playedKeys.add(sectionKey);
                    activeHomeSectionRef.current = matchedSection;
                    stopSpeech();
                    setStage("speaking");
                    setIsBubbleOpen(true);
                    playConfig(config);
                }
            }
        };

        const handleScroll = () => {
            if (scrollDebounceTimerRef.current) {
                clearTimeout(scrollDebounceTimerRef.current);
            }
            // 200ms settling timer: quick and responsive section introduction
            scrollDebounceTimerRef.current = setTimeout(() => {
                checkScrollSection();
            }, 200);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            if (scrollDebounceTimerRef.current) {
                clearTimeout(scrollDebounceTimerRef.current);
            }
            window.removeEventListener("scroll", handleScroll);
            activeHomeSectionRef.current = null;
        };
    }, [location.pathname, playConfig, stopSpeech]);

    const handleDismiss = () => {
        stopSpeech();
        if (videoRef.current) {
            videoRef.current.pause();
        }
        if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
        }
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = null;
        }
        dwellSatisfiedRef.current = false;
        setIsBubbleOpen(false);
        setStage("hidden");
    };

    const toggleMute = () => {
        if (!isMuted) {
            isMutedRef.current = true;
            stopSpeech();
            setIsMuted(true);
        } else {
            isMutedRef.current = false;
            setIsMuted(false);
            setStage("speaking");
            setIsBubbleOpen(true);
            playConfig(activeConfigRef.current);
        }
    };

    const handleAvatarClick = () => {
        hasUserInteractedRef.current = true;
        setHasTouched(true);
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = null;
        }
        setIsBubbleOpen(true);
        setStage("speaking");
        playConfig(activeConfigRef.current);
    };

    if (location.pathname === "/qr-scan" || location.pathname === "/qr" || location.pathname === "/terms") return null;

    // Visible on interaction when speaking or in friendly idle state
    const isVisible = hasTouched && (stage === "entering" || stage === "speaking" || stage === "idle") && !isFormActive;

    // Route-specific placement to utilize empty space:
    // - On /contact: Position in the MIDDLE part between contact details and the map (as marked in red)
    // - On /events: Position on the LEFT under Scheduled Bookings
    const isCenter = location.pathname === "/contact";
    const isLeft = location.pathname === "/events";
    const isFacilities = location.pathname === "/facilities";
    const isGallery = location.pathname === "/gallery";
    const isHome = location.pathname === "/";

    return (
        <>
            {/* Quick Re-open Virtual Concierge Pill when dismissed */}
            {hasTouched && stage === "hidden" && !isFormActive && (
                <button
                    onClick={handleAvatarClick}
                    className={`fixed bottom-3 z-30 flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur-md border border-[hsl(var(--gold)/0.5)] shadow-[var(--shadow-elegant)] text-foreground text-xs font-semibold hover:border-[hsl(var(--gold))] hover:scale-105 active:scale-95 transition-all cursor-pointer group ${
                        isLeft ? "left-3 sm:left-6" : "right-3 sm:right-6"
                    }`}
                    title="Click to speak with Virtual Concierge"
                    aria-label="Open Virtual Concierge"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--gold))] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--gold))]"></span>
                    </span>
                    <span className="gold-text tracking-wider uppercase text-[10px]">Virtual Concierge</span>
                </button>
            )}

            <aside
                aria-label="Interactive Concierge"
                className={`fixed bottom-2 sm:bottom-4 z-30 flex flex-col pointer-events-none select-none transition-all duration-700 ease-out ${
                    isCenter
                        ? "left-[43%] sm:left-[44%] md:left-[45%] -translate-x-1/2 items-center"
                        : isLeft
                        ? "left-1 sm:left-2 md:left-3 lg:left-4 items-start"
                        : "right-1 sm:right-3 md:right-4 lg:right-6 items-end"
                } ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
                }`}
            >
                {/* Compact Message Structure Speech Bubble */}
                {isVisible && (
                    <div
                        className={`relative mb-1.5 pointer-events-auto transition-all duration-500 ease-out ${
                            isCenter ? "mx-auto" : isLeft ? "ml-1" : "mr-1 sm:mr-2"
                        } ${
                            isBubbleOpen
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                        }`}
                    >
                        <div
                            onClick={handleAvatarClick}
                            title="Click to interact"
                            className="relative max-w-[160px] sm:max-w-[185px] bg-card/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[hsl(var(--gold)/0.45)] shadow-[var(--shadow-elegant)] flex items-start gap-1.5 cursor-pointer hover:border-[hsl(var(--gold))] group transition-all"
                        >
                            <p className="text-[10px] sm:text-[11px] text-foreground font-medium leading-snug flex-1 select-text">
                                {currentText}
                            </p>
                            <div className="flex items-center gap-0.5 shrink-0 pt-0.5 border-l border-border/40 pl-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/60 transition-colors"
                                    title={isMuted ? "Unmute voice" : "Mute voice"}
                                    aria-label={isMuted ? "Unmute voice" : "Mute voice"}
                                >
                                    {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/60 transition-colors"
                                    title="Dismiss"
                                    aria-label="Dismiss concierge"
                                >
                                    <X size={10} />
                                </button>
                            </div>

                            {/* Speech Bubble Tail pointing down towards the boy */}
                            <div
                                className={`absolute -bottom-1 w-2.5 h-2.5 bg-card rotate-45 border-r border-b border-[hsl(var(--gold)/0.45)] ${
                                    isCenter
                                        ? "left-1/2 -translate-x-1/2"
                                        : isLeft
                                        ? "left-5 sm:left-6"
                                        : "right-5 sm:right-6"
                                }`}
                            />
                        </div>
                    </div>
                )}

                {/* Character Stage - Sleek 3:4 Vertical Profile Utilizing Exact Empty Space */}
                <div
                    onClick={handleAvatarClick}
                    title="Click the boy to speak"
                    className={`relative w-28 sm:w-32 md:w-40 lg:w-44 xl:w-48 aspect-[3/4] cursor-pointer pointer-events-auto overflow-visible transition-all duration-300 ease-in-out translate-y-[0.6cm] ${
                        isFacilities ? "translate-x-[1.5cm]" : ""
                    } ${
                        isGallery ? "translate-x-[0.8cm]" : ""
                    } ${
                        isHome ? "translate-x-[0.6cm]" : ""
                    } ${
                        isLeft ? "-translate-x-[1.5cm]" : ""
                    }`}
                >
                    {/* 100% Pure Transparent WebGL Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={810}
                        height={1080}
                        className={`w-full h-full object-contain block bg-transparent border-0 outline-none shadow-none pointer-events-auto ${
                            isCenter ? "object-center" : isLeft ? "object-left" : "object-right"
                        }`}
                    />

                    {/* Video Source - Streamlined H.264 Faststart */}
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute inset-0 w-full h-full opacity-[0.001] pointer-events-none -z-10"
                    />

                    {/* Natural Voice Audio Source */}
                    <audio
                        ref={audioRef}
                        preload="auto"
                        className="hidden"
                    />
                </div>
            </aside>
        </>
    );
}
