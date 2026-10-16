import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";
import SEO from "@/components/SEO";

const Contact = () => (
  <div className="pt-20">
    <SEO
      title="Contact A.R Grand · Marriage Hall in Kodungaiyur, Chennai"
      description="Visit or call A.R Grand Marriage Hall on Sidco Main Rd, Kodungaiyur. Phone +91 94440 43451. Open 9 AM – 9 PM for bookings & venue visits."
      path="/contact"
    />
    <section className="section-padding max-w-7xl mx-auto">
      <h1 className="heading-xl text-center text-foreground mb-4">Contact Us</h1>
      <p className="text-body text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        We'd love to hear from you. Reach out to us for bookings, enquiries, or a venue visit.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl text-foreground mb-1">Address</h3>
              <a
                href="https://www.google.com/maps/search/?api=1&query=AR+Grands,+No+5C%2F1,+Sidco+Main+Rd,+near+TNEB,+Kodungaiyur+(East),+Vivekananda+Nagar,+Chennai+-+600118"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body text-muted-foreground hover:text-primary transition-colors block leading-relaxed"
                title="Open in Google Maps"
              >
                No 5C/1, Sidco Main Rd, near TNEB, Kodungaiyur (East), Vivekananda Nagar, Kodungaiyur, Chennai, Tamil Nadu 600118
                <span className="text-xs text-primary font-semibold block mt-1">📍 Open in Google Maps →</span>
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl text-foreground mb-1">Phone</h3>
              <p className="text-body text-muted-foreground">
                <a href="tel:+919444043451" className="hover:text-primary transition-colors block">+91 94440 43451</a>
                <a href="tel:+919791165395" className="hover:text-primary transition-colors block mt-0.5">+91 97911 65395</a>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl text-foreground mb-1">Email</h3>
              <p className="text-body text-muted-foreground">
                <a href="mailto:info@argrand.com" className="hover:text-primary transition-colors block">info@argrand.com</a>
                <a href="mailto:bookings@argrand.com" className="hover:text-primary transition-colors block mt-0.5">bookings@argrand.com</a>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl text-foreground mb-1">Working Hours</h3>
              <p className="text-body text-muted-foreground">Mon – Sun: 9:00 AM – 9:00 PM</p>
            </div>
          </div>

          <a
            href="https://wa.me/919791165395?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20A.R%20Grand."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#25D366] text-white hover:opacity-90 transition-opacity w-fit font-body text-sm tracking-wider uppercase"
          >
            <MessageCircle size={18} />
            Message us on WhatsApp
          </a>

          <div>
            <h3 className="font-heading text-xl text-foreground mb-3">Follow Us</h3>
            <SocialLinks />
          </div>
        </div>

        {/* Google Map */}
        <div className="rounded-lg overflow-hidden shadow-lg h-96 lg:h-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.0!2d80.2464!3d13.1167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5264000000000%3A0x0!2sKodungaiyur%2C+Chennai!5e0!3m2!1sen!2sin!4v1"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "384px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="A.R Grand Location"
          />
        </div>
      </div>
    </section>
  </div>
);

export default Contact;
