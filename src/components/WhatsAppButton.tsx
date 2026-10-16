import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "919791165395";

const WhatsAppButton = () => {
  const location = useLocation();
  // On /events and /contact the avatar utilizes the empty space on the left,
  // so the floating WhatsApp button gracefully positions on the right.
  const isRight = location.pathname === "/events" || location.pathname === "/contact";

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
