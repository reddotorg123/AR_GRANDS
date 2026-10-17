import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  { image: hero1, eyebrow: "A.R Grand · Kodungaiyur", title: "Where Dreams Come True", subtitle: "Celebrate your special day in timeless elegance" },
  { image: hero2, eyebrow: "Signature Celebrations", title: "Elegant Moments, Crafted", subtitle: "Stunning décor and world-class hospitality" },
  { image: hero3, eyebrow: "Grand Wedding Halls", title: "A Stage For Forever", subtitle: "Spacious seating with breathtaking stage settings" },
  { image: hero4, eyebrow: "Intimate to Grand", title: "Unforgettable Moments", subtitle: "Capacity for 50 to 250 distinguished guests" },
  { image: hero5, eyebrow: "Premium Ambience", title: "Refined Interiors", subtitle: "Fully air-conditioned with bespoke detailing" },
];

const HeroSlider = () => {
  const [isRevealed, setIsRevealed] = useState(() => !!sessionStorage.getItem("ar_grand_site_loaded"));

  useEffect(() => {
    const handlePreloaderDone = () => setIsRevealed(true);
    window.addEventListener("preloaderFinished", handlePreloaderDone);
    return () => window.removeEventListener("preloaderFinished", handlePreloaderDone);
  }, []);

  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-noir hero-swiper">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        loop
        speed={1400}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
        className="h-full w-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 animate-ken-burns">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  width={1920}
                  height={1080}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  {...(i === 0 ? { fetchPriority: "high" as any } : {})}
                />
              </div>
              {/* Cinematic overlays */}
              <div className="absolute inset-0" style={{ background: "var(--gradient-hero-overlay)" }} />
              <div className="absolute inset-0" style={{ background: "var(--gradient-vignette)" }} />

              <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
                <div className="max-w-3xl">
                  {/* Order 1: Eyebrow badge */}
                  <p
                    className={`eyebrow text-accent/90 mb-4 transition-all duration-700 ease-out ${isRevealed ? "opacity-100 translate-y-0 delay-[250ms]" : "opacity-0 translate-y-6"
                      }`}
                  >
                    {slide.eyebrow}
                  </p>

                  {/* Order 2: Gold divider */}
                  <div
                    className={`flex justify-center transition-all duration-700 ease-out ${isRevealed ? "opacity-100 scale-100 delay-[350ms]" : "opacity-0 scale-75"
                      }`}
                  >
                    <span className="gold-divider mb-6" />
                  </div>

                  {/* Order 3: Main luxury headline */}
                  <h1
                    className={`heading-xl text-cream mb-6 drop-shadow-2xl transition-all duration-800 ease-out ${isRevealed ? "opacity-100 translate-y-0 delay-[500ms]" : "opacity-0 translate-y-8"
                      }`}
                  >
                    {slide.title}
                  </h1>

                  {/* Order 4: Subtitle */}
                  <p
                    className={`text-body text-cream/85 text-lg md:text-xl mb-10 max-w-xl mx-auto transition-all duration-700 ease-out ${isRevealed ? "opacity-100 translate-y-0 delay-[750ms]" : "opacity-0 translate-y-6"
                      }`}
                  >
                    {slide.subtitle}
                  </p>

                  {/* Order 5: Call to action buttons */}
                  <div
                    className={`flex flex-wrap gap-4 justify-center transition-all duration-700 ease-out ${isRevealed ? "opacity-100 translate-y-0 delay-[1000ms]" : "opacity-0 translate-y-6"
                      }`}
                  >
                    <Link to="/enquiry" className="btn-gold shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
                      Book Your Venue
                    </Link>
                    <Link
                      to="/gallery"
                      className="btn-outline-gold !text-cream !border-cream/60 hover:!bg-cream hover:!text-noir backdrop-blur-sm"
                    >
                      View Gallery
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Order 6: Slide navigation controls & scroll indicator */}
      <button
        className={`hero-prev hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full border border-cream/30 text-cream backdrop-blur-sm hover:bg-cream hover:text-noir transition-all duration-700 ${isRevealed ? "opacity-100 delay-[1250ms]" : "opacity-0"
          }`}
        aria-label="Previous"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        className={`hero-next hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full border border-cream/30 text-cream backdrop-blur-sm hover:bg-cream hover:text-noir transition-all duration-700 ${isRevealed ? "opacity-100 delay-[1250ms]" : "opacity-0"
          }`}
        aria-label="Next"
      >
        <ChevronRight size={22} />
      </button>

      {/* Scroll cue */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-all duration-700 ${isRevealed ? "opacity-100 delay-[1400ms]" : "opacity-0"
          }`}
      >
        <div className="flex flex-col items-center gap-2 text-cream/70 animate-float">
          <span className="text-[10px] tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-cream/70 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
