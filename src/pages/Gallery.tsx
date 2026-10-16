import { useState } from "react";
import { X, Loader2, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import gallery9 from "@/assets/gallery-9.jpg";
import gallery10 from "@/assets/gallery-10.jpg";

const images = [
  { src: gallery1, alt: "A.R Grand Marriage Hall Aerial Exterior View", span: "lg:col-start-1 lg:row-start-1 lg:row-span-2" },
  { src: gallery2, alt: "Elegant Wedding Stage Decoration with Floral Arch", span: "lg:col-start-2 lg:row-start-1" },
  { src: gallery3, alt: "Close-up of Bridal Stage with Floral Arrangements", span: "col-span-2 lg:col-start-3 lg:col-span-2 lg:row-start-1" },
  { src: gallery4, alt: "Grand Entrance with Traditional Floral Garlands", span: "lg:col-start-2 lg:row-start-2" },
  { src: gallery5, alt: "Hall Front View with Stage and Seating", span: "lg:col-start-3 lg:row-start-2 lg:row-span-2" },
  { src: gallery6, alt: "Hall Back View with Full Seating Arrangement", span: "lg:col-start-4 lg:row-start-2" },
  { src: gallery7, alt: "Hall Side View with Stage and Seated Layout", span: "lg:col-start-1 lg:row-start-3" },
  { src: gallery8, alt: "Spacious Hall Interior with Decorated Seating", span: "col-span-2 lg:col-start-1 lg:col-span-2 lg:row-start-4" },
  { src: gallery9, alt: "Wide Hall View Showcasing Capacity and Decor", span: "lg:col-start-3 lg:row-start-4" },
  { src: gallery10, alt: "Lift and Staircase Access to Marriage Hall", span: "lg:col-start-4 lg:row-start-4" },
];

const Gallery = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const next = () => setSelected((s) => (s === null ? s : (s + 1) % images.length));
  const prev = () => setSelected((s) => (s === null ? s : (s - 1 + images.length) % images.length));

  return (
    <div className="pt-24">
      <SEO
        title="Gallery · A.R Grand Marriage Hall, Kodungaiyur Chennai"
        description="Explore photos of A.R Grand wedding hall in Kodungaiyur — stage decor, hall interiors, seating, and exterior views of our Chennai banquet venue."
        path="/gallery"
      />
      {/* Page hero */}
      <section className="relative px-4 md:px-8 lg:px-16 pt-12 pb-20 text-center max-w-5xl mx-auto">
        <p className="eyebrow mb-4">A Visual Journey</p>
        <span className="gold-divider mb-6" />
        <h1 className="heading-xl text-foreground mb-6">
          Our <span className="italic gold-text">Gallery</span>
        </h1>
        <p className="text-body text-muted-foreground max-w-2xl mx-auto">
          Explore the elegance and grandeur of A.R Grand through carefully captured moments of our celebrations and spaces.
        </p>
      </section>

      <section className="px-4 md:px-8 lg:px-16 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[220px] gap-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`group relative overflow-hidden rounded-sm shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all duration-700 cursor-pointer ${img.span}`}
              aria-label={img.alt}
            >
              {!loaded[i] && <Skeleton className="absolute inset-0 w-full h-full" />}
              <img
                src={img.src}
                alt={img.alt}
                width={800}
                height={600}
                loading="lazy"
                onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${loaded[i] ? "opacity-100" : "opacity-0"
                  }`}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-noir/85 via-noir/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <ZoomIn size={16} />
                  <span className="text-[10px] tracking-[0.3em] uppercase">View</span>
                </div>
                <p className="font-heading text-lg text-cream leading-snug">{img.alt}</p>
              </div>
              {/* Gold corner accent */}
              <span className="absolute top-3 left-3 w-6 h-px bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="absolute top-3 left-3 w-px h-6 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-noir/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-6 right-6 text-cream hover:text-accent transition-colors"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-cream hover:text-accent transition-colors p-2"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-cream hover:text-accent transition-colors p-2"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
          >
            <ChevronRight size={36} />
          </button>

          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            {!loaded[selected] && (
              <Loader2 className="absolute inset-0 m-auto animate-spin text-accent" size={48} />
            )}
            <img
              src={images[selected].src}
              alt={images[selected].alt}
              className="max-w-full max-h-[82vh] mx-auto object-contain rounded-sm shadow-[var(--shadow-elegant)]"
            />
            <p className="text-center text-cream/80 font-heading text-lg mt-6">{images[selected].alt}</p>
            <p className="text-center text-cream/50 text-xs tracking-[0.3em] uppercase mt-2">
              {selected + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
