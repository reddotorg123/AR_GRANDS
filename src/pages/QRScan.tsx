import { useState, useRef, useEffect } from "react";

export default function QRScan() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const redirectedRef = useRef(false);

    const googleMapsUrl =
        "https://www.google.com/maps/search/?api=1&query=AR+Grands,+No+5C%2F1,+Sidco+Main+Rd,+near+TNEB,+Kodungaiyur+(East),+Vivekananda+Nagar,+Chennai+-+600118";

    const redirectToMap = () => {
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        window.location.href = googleMapsUrl;
    };

    const handleStart = () => {
        setIsOverlayVisible(false);
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play().catch((err) => {
                console.error("Playback error:", err);
            });
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Redirect when video reaches end
        const onEnded = () => redirectToMap();

        // Fallback in case ended event doesn't fire fast enough
        const onTimeUpdate = () => {
            if (video.duration && video.duration - video.currentTime < 0.2) {
                video.pause();
                redirectToMap();
            }
        };

        video.addEventListener("ended", onEnded);
        video.addEventListener("timeupdate", onTimeUpdate);

        return () => {
            video.removeEventListener("ended", onEnded);
            video.removeEventListener("timeupdate", onTimeUpdate);
        };
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#000",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
                margin: 0,
                padding: 0
            }}
        >
            {/* Play overlay to start video with sound */}
            {isOverlayVisible && (
                <div
                    id="play-overlay"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 100,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.5)"
                    }}
                >
                    <button
                        id="start-btn"
                        onClick={handleStart}
                        style={{
                            padding: "15px 30px",
                            fontSize: "20px",
                            fontWeight: "bold",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
                        }}
                    >
                        Tap to go Google Map
                    </button>
                </div>
            )}

            {/* Client-Approved Main Video Animation */}
            <video
                ref={videoRef}
                id="main-video"
                src="/qr-animation.mp4"
                playsInline
                preload="auto"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                    userSelect: "none"
                }}
            />
        </div>
    );
}
