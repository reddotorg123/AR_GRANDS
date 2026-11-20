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

const isExcludedRoute = (pathname: string) => {
    return (
        pathname === "/enquiry" ||
        pathname.startsWith("/enquiry") ||
        pathname === "/admin" ||
        pathname.startsWith("/admin") ||
        pathname === "/qr-scan" ||
        pathname === "/qr" ||
        pathname === "/terms"
    );
};

// High-Quality Lip-Synced Assets with EXACT Synchronized Dialogue Syllables
const routeAvatarConfigs: Record<string, AvatarConfig> = {
    "/": { videoSrc: "/avatar-welcome.mp4", audioSrc: "/audio/home.mp3", text: "Welcome to A.R. Grand! Explore our luxury halls." },
    "/gallery": { videoSrc: "/avatar-gallery.mp4", audioSrc: "/audio/gallery.mp3", text: "Browse our grand stage settings, lighting, and decor." },
    "/facilities": { videoSrc: "/avatar-features.mp4", audioSrc: "/audio/facilities.mp3", text: "Air-conditioned halls, premium dining, and private bridal suites await you." },
    "/events": { videoSrc: "/avatar-events.mp4", audioSrc: "/audio/events.mp3", text: "Check available dates for weddings, receptions, and parties." },
    "/contact": { videoSrc: "/avatar-cta.mp4", audioSrc: "/audio/contact.mp3", text: "Ready to celebrate? Book your dream date today." },
    "/admin": { videoSrc: "/avatar-admin.mp4", audioSrc: "/audio/admin.mp3", text: "Welcome manager, please sign in to access bookings." },
    "/locations/perambur": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/perambur.mp3", text: "Easily accessible venues across North Chennai with ample parking." },
    "/locations/vyasarpadi": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/vyasarpadi.mp3", text: "Easily accessible venues across North Chennai with ample parking." },
    "/locations/madhavaram": { videoSrc: "/avatar-location.mp4", audioSrc: "/audio/madhavaram.mp3", text: "Easily accessible venues across North Chennai with ample parking." }
};

// Tracks all sections & routes that have already played during this browser session.
// Cleared automatically on page reload so animations run strictly ONCE until the next reload.
const playedKeys = new Set<string>();

export default function InteractiveAvatar() {
    // Initial stage: hidden until mounted and route checked
    const [stage, setStage] = useState<"hidden" | "entering" | "waiting" | "speaking" | "idle" | "rejected">("hidden");
    const [tourPromptActive, setTourPromptActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [, setAudioBlocked] = useState(false);
    const [currentText, setCurrentText] = useState("Welcome to A.R. Grand! Explore our luxury halls.");
    const [isBubbleOpen, setIsBubbleOpen] = useState(false);
    const [isFormActive, setIsFormActive] = useState(false);

    const location = useLocation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMutedRef = useRef(false);
    const activeConfigRef = useRef<AvatarConfig>(routeAvatarConfigs["/"]);

    // Concurrency Token: Ensures rapid switching NEVER triggers stale video/audio events
    const playRequestIdRef = useRef(0);

    // Audio & Scroll Queue Controls: Speech finishes before next clip; no rapid scroll conflicts
    const isSpeakingRef = useRef(false);
    const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Dwell condition controls
    const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dwellSatisfiedRef = useRef(false);
    const hasUserInteractedRef = useRef(false);

    // Clear WebGL canvas to fully transparent pixels
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
            if (gl) {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        } catch (_) {}
    }, []);

    const stopSpeech = useCallback(() => {
        playRequestIdRef.current += 1;
        isSpeakingRef.current = false;
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
            audio = new Audio(config.audioSrc);
            audio.preload = "auto";
            audioRef.current = audio;
        }

        // Configure audio element
        if (audio && config.audioSrc) {
            audio.loop = false;
            audio.muted = isMutedRef.current;
            if (!audio.src.endsWith(config.audioSrc)) {
                audio.src = config.audioSrc;
            }

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
                    clearCanvas();
                    setStage("hidden");
                }, 800);
            };
        }

        // Atomic Synchronized Launch: Video and Audio start IMMEDIATELY and synchronously in the user callstack
        if (video) {
            video.loop = false;
            video.muted = true;
            video.defaultMuted = true;

            // AV Master Sync: Audio is the master clock. If video drifts, gently adjust video to match audio speech.
            video.ontimeupdate = () => {
                const currentAudio = audioRef.current;
                if (currentAudio && !currentAudio.paused && !video.paused) {
                    const diff = video.currentTime - currentAudio.currentTime;
                    // Resync video to audio if out of sync by > 300ms, preserving uninterrupted crystal-clear audio
                    if (Math.abs(diff) > 0.3) {
                        try {
                            video.currentTime = currentAudio.currentTime;
                        } catch (_) {}
                    }
                }
            };

            video.onended = () => {
                if (playRequestIdRef.current !== currentReqId) return;
                video.pause();
                if (!isSpeakingRef.current) {
                    setIsBubbleOpen(false);
                    clearCanvas();
                    setStage("hidden");
                }
            };

            if (!video.src.endsWith(config.videoSrc)) {
                video.src = config.videoSrc;
            }

            try {
                video.currentTime = 0;
            } catch (_) {}

            const vPromise = video.play();
            if (vPromise !== undefined) vPromise.catch(() => {});
        }

        if (!isMutedRef.current && audio && config.audioSrc) {
            audio.muted = false;
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
                    clearCanvas();
                    setStage("hidden");
                }, 2500);
            }
        }
    }, [clearCanvas]);

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

        let lastFrameTime = -1;
        const render = () => {
            if (isCancelled) return;
            if (gl && program && quadBuffer && tex && video.readyState >= 2) {
                const curTime = video.currentTime;
                const isNewFrame = curTime !== lastFrameTime;

                if (!video.paused && isNewFrame) {
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

                        // Only re-upload video pixel texture to GPU memory when timestamp changes
                        if (isNewFrame) {
                            lastFrameTime = curTime;
                            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                            const uVideoLoc = gl.getUniformLocation(program, "u_video");
                            gl.uniform1i(uVideoLoc, 0);

                            gl.viewport(0, 0, canvas.width, canvas.height);
                            gl.clearColor(0, 0, 0, 0);
                            gl.clear(gl.COLOR_BUFFER_BIT);
                            gl.drawArrays(gl.TRIANGLES, 0, 6);
                        }
                    } catch (_) {}
                }
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

    // Tab Visibility Protection: Pauses on background tab and resumes cleanly without blank frames
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

    // Handle user tour confirmation: Click "Yes"
    const handleStartTour = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTourPromptActive(false);
        hasUserInteractedRef.current = true;
        const routeKey = "route:" + location.pathname;
        playedKeys.add(routeKey);

        const config = routeAvatarConfigs[location.pathname] || routeAvatarConfigs["/"];
        activeConfigRef.current = config;

        // Immediate direct synchronous user activation unlock for audio & video on click/tap
        if (audioRef.current && !isMutedRef.current) {
            const audio = audioRef.current;
            audio.muted = false;
            audio.play().catch(() => {});
        }
        if (videoRef.current) {
            const video = videoRef.current;
            video.muted = true;
            video.play().catch(() => {});
        }

        setStage("speaking");
        setIsBubbleOpen(true);
        playConfig(config);
    };

    // Handle user declining tour: Click "No"
    const handleDeclineTour = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTourPromptActive(false);
        const routeKey = "route:" + location.pathname;
        playedKeys.add(routeKey);
        handleDismiss();
    };

    // User touch interaction listener for subpages or general audio unlock
    useEffect(() => {
        const onFirstInteraction = () => {
            if (isExcludedRoute(location.pathname)) return;

            // If on home page and not yet played, let the polite "Want my help?" prompt stay active
            if (location.pathname === "/" && !playedKeys.has("route:/")) {
                return;
            }

            if (hasUserInteractedRef.current) return;
            hasUserInteractedRef.current = true;

            window.removeEventListener("pointerdown", onFirstInteraction, true);
            window.removeEventListener("touchstart", onFirstInteraction, true);
            window.removeEventListener("click", onFirstInteraction, true);
            window.removeEventListener("keydown", onFirstInteraction, true);

            const config = activeConfigRef.current;
            if (config?.audioSrc) {
                let audio = audioRef.current;
                if (!audio) {
                    audio = new Audio(config.audioSrc);
                    audio.preload = "auto";
                    audioRef.current = audio;
                }
                audio.muted = false;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            }

            if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {});
            }

            const routeKey = "route:" + location.pathname;
            if (!playedKeys.has(routeKey)) {
                playedKeys.add(routeKey);
                setStage("speaking");
                setIsBubbleOpen(true);
                playConfig(config);
            }
        };

        window.addEventListener("pointerdown", onFirstInteraction, true);
        window.addEventListener("touchstart", onFirstInteraction, true);
        window.addEventListener("click", onFirstInteraction, true);
        window.addEventListener("keydown", onFirstInteraction, true);

        return () => {
            window.removeEventListener("pointerdown", onFirstInteraction, true);
            window.removeEventListener("touchstart", onFirstInteraction, true);
            window.removeEventListener("click", onFirstInteraction, true);
            window.removeEventListener("keydown", onFirstInteraction, true);
        };
    }, [location.pathname, playConfig]);

    // Route Switching & Dwell Timing:
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

        if (isExcludedRoute(location.pathname)) {
            setStage("hidden");
            setIsBubbleOpen(false);
            setTourPromptActive(false);
            return;
        }

        const config = routeAvatarConfigs[location.pathname] || routeAvatarConfigs["/"];
        activeConfigRef.current = config;

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

        dwellTimerRef.current = setTimeout(() => {
            dwellSatisfiedRef.current = true;

            if (location.pathname === "/") {
                if (!alreadyPlayed) {
                    // On Home screen, position idle poster on the LEFT asking: "Want my help?"
                    setStage("idle");
                    setCurrentText("Want my help?");
                    setIsBubbleOpen(true);
                    setTourPromptActive(true);
                } else {
                    setStage("hidden");
                    setIsBubbleOpen(false);
                    setTourPromptActive(false);
                }
                return;
            }

            // On other pages:
            if (alreadyPlayed) {
                setStage("hidden");
                setIsBubbleOpen(false);
            } else if (hasUserInteractedRef.current) {
                playedKeys.add(routeKey);
                setStage("speaking");
                setIsBubbleOpen(true);
                playConfig(config);
            } else {
                setStage("idle");
                setIsBubbleOpen(false);
            }
        }, DWELL_TIME_MS);

        return () => {
            if (dwellTimerRef.current) {
                clearTimeout(dwellTimerRef.current);
                dwellTimerRef.current = null;
            }
        };
    }, [location.pathname, stopSpeech, playConfig]);

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
        setTourPromptActive(false);
        clearCanvas();
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

    const handleAvatarClick = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        hasUserInteractedRef.current = true;
        setTourPromptActive(false);
        if (audioRef.current) {
            audioRef.current.muted = false;
        }
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.defaultMuted = true;
        }
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = null;
        }
        setIsBubbleOpen(true);
        setStage("speaking");
        playConfig(activeConfigRef.current);
    };

    if (isExcludedRoute(location.pathname)) return null;

    const isVisible = (stage === "entering" || stage === "speaking" || stage === "idle") && !isFormActive;

    const isHome = location.pathname === "/";
    const isCenter = location.pathname === "/contact";
    const isEvents = location.pathname === "/events";

    // On Home page: avatar stays on the LEFT when idle/asking for help, and slides to the RIGHT when speaking.
    // On other pages: events is left, contact is center, and others are right.
    const isAvatarOnRight = (isHome && stage === "speaking") || (!isHome && !isEvents && !isCenter);

    // Notify WhatsApp floating button to coordinate position without overlapping
    useEffect(() => {
        const side = isAvatarOnRight ? "right" : "left";
        window.dispatchEvent(new CustomEvent("avatar-position", { detail: side }));
    }, [isAvatarOnRight]);

    // Hardware-accelerated 60fps GPU transforms for low-spec mobile smooth sliding
    const translateY = isVisible ? "0px" : "48px";
    const translateX = isCenter
        ? "-50%"
        : isAvatarOnRight
        ? "calc(100vw - 100% - var(--edge-offset, 1.5rem))"
        : "0px";

    return (
        <>
            {/* Quick Re-open Virtual Concierge Pill when dismissed or tour finished */}
            {stage === "hidden" && !isFormActive && (
                <button
                    onClick={handleAvatarClick}
                    className={`fixed bottom-3 z-30 flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur-md border border-[hsl(var(--gold)/0.5)] shadow-[var(--shadow-elegant)] text-foreground text-xs font-semibold hover:border-[hsl(var(--gold))] hover:scale-105 active:scale-95 transition-all cursor-pointer group ${
                        isAvatarOnRight ? "right-3 sm:right-6" : "left-3 sm:left-6"
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
                className={`fixed bottom-2 sm:bottom-4 z-30 flex flex-col items-center select-none [--edge-offset:1.5rem] sm:[--edge-offset:3rem] md:[--edge-offset:4rem] ${
                    isCenter ? "left-1/2" : "left-3 sm:left-6 md:left-8"
                } ${
                    isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                style={{
                    transform: `translate3d(${translateX}, ${translateY}, 0)`,
                    transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease",
                    willChange: "transform"
                }}
            >
                {/* Speech Bubble */}
                {isVisible && (
                    <div
                        className={`relative mb-2 pointer-events-auto transition-all duration-400 ease-out ${
                            isBubbleOpen
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                        }`}
                    >
                        <div
                            onClick={tourPromptActive ? undefined : handleAvatarClick}
                            title={tourPromptActive ? undefined : "Click to interact"}
                            className="relative max-w-[170px] sm:max-w-[210px] bg-card/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[hsl(var(--gold)/0.45)] shadow-[var(--shadow-elegant)] flex flex-col gap-2 transition-all cursor-default"
                        >
                            <div className="flex items-center justify-between gap-1.5">
                                <p className="text-[11px] sm:text-xs text-foreground font-semibold leading-snug flex-1 select-text">
                                    {tourPromptActive ? "Want my help?" : currentText}
                                </p>
                                <div className="flex items-center gap-0.5 shrink-0 pt-0.5 border-l border-border/40 pl-1">
                                    {!tourPromptActive && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                            className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/60 transition-colors"
                                            title={isMuted ? "Unmute voice" : "Mute voice"}
                                            aria-label={isMuted ? "Unmute voice" : "Mute voice"}
                                        >
                                            {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                                        className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/60 transition-colors"
                                        title="Dismiss"
                                        aria-label="Dismiss concierge"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            </div>

                            {/* Yes / No Tour Prompt Interactive Buttons */}
                            {tourPromptActive && (
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                    <button
                                        onClick={handleStartTour}
                                        className="flex-1 py-1.5 px-3 rounded-lg bg-[hsl(var(--gold))] text-black font-bold text-[11px] hover:brightness-110 active:scale-95 transition-all text-center shadow-sm cursor-pointer"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={handleDeclineTour}
                                        className="flex-1 py-1.5 px-3 rounded-lg bg-muted text-muted-foreground font-medium text-[11px] hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all text-center cursor-pointer border border-border/40"
                                    >
                                        No
                                    </button>
                                </div>
                            )}

                            {/* Speech Bubble Tail pointing down towards the boy */}
                            <div
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card rotate-45 border-r border-b border-[hsl(var(--gold)/0.45)]"
                            />
                        </div>
                    </div>
                )}

                {/* Character Stage - Sleek 3:4 Vertical Profile Fully Visible Within Viewport */}
                <div
                    onClick={tourPromptActive ? handleStartTour : handleAvatarClick}
                    title={tourPromptActive ? "Click Yes to start tour" : "Click the boy to speak"}
                    className="relative w-28 sm:w-36 md:w-40 lg:w-44 aspect-[3/4] cursor-pointer pointer-events-auto overflow-visible select-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {/* Idle state static transparent visual for pristine instant appearance without video lag */}
                    <img
                        src="/avatar-idle.png"
                        alt="A.R. Grands Concierge"
                        className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
                            stage === "speaking" ? "opacity-0" : "opacity-100"
                        }`}
                    />

                    {/* 100% Pure Transparent WebGL Canvas (Active during speaking video playback) */}
                    <canvas
                        ref={canvasRef}
                        width={480}
                        height={640}
                        className={`w-full h-full object-contain block bg-transparent border-0 outline-none shadow-none pointer-events-auto will-change-transform transition-opacity duration-300 ${
                            stage === "speaking" ? "opacity-100" : "opacity-0"
                        }`}
                    />

                    {/* Hidden offscreen 1x1 video element strictly used as WebGL texture source - zero visible green mat */}
                    <video
                        ref={videoRef}
                        src="/avatar-welcome.mp4"
                        muted
                        playsInline
                        // @ts-ignore
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        disablePictureInPicture
                        disableRemotePlayback
                        preload="auto"
                        crossOrigin="anonymous"
                        style={{
                            position: "absolute",
                            width: "1px",
                            height: "1px",
                            opacity: 0,
                            pointerEvents: "none",
                            zIndex: -9999,
                            top: "-9999px",
                            left: "-9999px"
                        }}
                    />

                    {/* Natural Voice Audio Source Preloaded for Zero Delay */}
                    <audio
                        ref={audioRef}
                        src="/audio/home.mp3"
                        preload="auto"
                        playsInline
                        // @ts-ignore
                        webkit-playsinline="true"
                        style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
                    />
                </div>
            </aside>
        </>
    );
}
