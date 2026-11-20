import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "919791165395";

const WhatsAppButton = () => {
  const location = useLocation();
  const [avatarSide, setAvatarSide] = useState<"left" | "right">("left");

  useEffect(() => {
    const handleAvatarPos = (e: Event) => {
      const customEvent = e as CustomEvent<"left" | "right">;
      if (customEvent.detail) {
        setAvatarSide(customEvent.detail);
      }
    };
    window.addEventListener("avatar-position", handleAvatarPos);
    return () => window.removeEventListener("avatar-position", handleAvatarPos);
  }, []);

  // When avatar is on the left (e.g. idle on home, or on /events), WhatsApp button gracefully positions on the right.
  // When avatar is on the right (speaking on home, or standard pages), WhatsApp gracefully positions on the left.
  const isContactOrEvents = location.pathname === "/events" || location.pathname === "/contact";
  const isRight = isContactOrEvents || (location.pathname === "/" && avatarSide === "left");

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'd like to enquire about A.R Grand.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      className={`fixed bottom-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-500 animate-fade-in ${
        isRight ? "right-6" : "left-6"
      }`}
    >
      <MessageCircle size={28} fill="white" />
    </a>
  );
};

export default WhatsAppButton;
