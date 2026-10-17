import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle, ExternalLink } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";

const Footer = () => (
  <footer className="relative noir-bg text-cream overflow-hidden">
    <div className="absolute inset-0 opacity-[0.05]" style={{ background: "var(--gradient-gold)" }} />
    <div className="relative max-w-7xl mx-auto section-padding">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
        <div>
          <h3 className="font-heading text-3xl mb-2 tracking-[0.1em]">
            A.R <span className="gold-text">Grand</span>
          </h3>
          <span className="gold-divider mb-5" />
          <p className="text-body text-cream/70 mb-6 leading-relaxed">
            Your dream wedding venue in Kodungaiyur, North Chennai. Elegant spaces for unforgettable celebrations, crafted with care since over a decade.
          </p>
          <SocialLinks />
        </div>
        <div>
          <h4 className="eyebrow mb-5 text-accent">Quick Links</h4>
          <div className="grid grid-cols-2 gap-y-3">
            {[
              { to: "/", label: "Home" },
              { to: "/gallery", label: "Gallery" },
              { to: "/events", label: "Events" },
              { to: "/facilities", label: "Facilities" },
              { to: "/contact", label: "Contact" },
              { to: "/enquiry", label: "Book Now" },
              { to: "/terms", label: "Terms" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-body text-cream/70 hover:text-accent transition-colors duration-300 link-underline w-fit"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <h4 className="eyebrow mt-8 mb-4 text-accent">Areas We Serve</h4>
          <div className="grid grid-cols-2 gap-y-2">
            {[
              { to: "/locations/perambur", label: "Perambur" },
              { to: "/locations/vyasarpadi", label: "Vyasarpadi" },
              { to: "/locations/madhavaram", label: "Madhavaram" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-body text-cream/70 hover:text-accent transition-colors duration-300 link-underline w-fit text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="eyebrow mb-5 text-accent">Get In Touch</h4>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 text-cream/75">
              <Phone size={16} className="mt-1 shrink-0 text-accent" />
              <div className="text-body text-sm flex flex-col gap-0.5">
                <a href="tel:+919444043451" className="hover:text-accent transition-colors w-fit">
                  +91 94440 43451
                </a>
                <a href="tel:+919791165395" className="hover:text-accent transition-colors w-fit">
                  +91 97911 65395
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 text-cream/75">
              <Mail size={16} className="mt-1 shrink-0 text-accent" />
              <a href="mailto:info@argrand.com" className="text-body text-sm hover:text-accent transition-colors w-fit">
                info@argrand.com
              </a>
            </div>
            <div className="flex items-start gap-3 text-cream/75">
              <MapPin size={16} className="mt-1 shrink-0 text-accent" />
              <a
                href="https://www.google.com/maps/search/?api=1&query=AR+Grands,+No+5C%2F1,+Sidco+Main+Rd,+near+TNEB,+Kodungaiyur+(East),+Vivekananda+Nagar,+Chennai+-+600118"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors group flex flex-col gap-1"
                title="Open A.R Grand in Google Maps"
              >
                <span className="text-body text-sm leading-relaxed">
                  No 5C/1, Sidco Main Rd, near TNEB, Kodungaiyur (East), Vivekananda Nagar, Chennai – 600118
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold group-hover:underline w-fit">
                  <span>📍 View on Google Maps</span>
                  <ExternalLink size={12} />
                </span>
              </a>
            </div>
            <a
              href="https://wa.me/919791165395"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-sm bg-[#25D366] text-white hover:opacity-90 transition-opacity w-fit"
            >
              <MessageCircle size={16} />
              <span className="text-body text-xs tracking-widest uppercase">WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-body text-cream/50 text-sm">© 2026 A.R Grand. All rights reserved.</p>
        <p className="text-body text-cream/40 text-xs tracking-[0.25em] uppercase">Crafted with care by RedDot</p>
      </div>
    </div>
  </footer>
);

export default Footer;
