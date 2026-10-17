import SEO from "@/components/SEO";
import { ArrowUpDown, Car, Zap, Snowflake, DoorClosed, ChefHat } from "lucide-react";
import facilityLift from "@/assets/facility-lift.jpg";
import facilityParking from "@/assets/facility-parking.jpg";
import facilityGenset from "@/assets/facility-genset.jpg";
import facilityAcHall from "@/assets/facility-ac-hall.jpg";
import facilityPrivateRoom from "@/assets/facility-private-room.jpg";
import facilityKitchen from "@/assets/facility-kitchen.jpg";

const facilities = [
  {
    icon: ArrowUpDown,
    title: "Lifts",
    description:
      "Modern passenger elevators provide easy and comfortable access to all floors of the venue, ensuring convenience for elderly guests and those with limited mobility.",
    image: facilityLift,
    alt: "Modern passenger lift at A.R Grand Marriage Hall",
  },
  {
    icon: Car,
    title: "Spacious Car Parking",
    description:
      "Ample on-site parking accommodates a large number of vehicles, with attended valet service available to keep your guests' arrival smooth and stress-free.",
    image: facilityParking,
    alt: "Spacious car parking area at A.R Grand",
  },
  {
    icon: Zap,
    title: "Power Backup Gensets",
    description:
      "High-capacity diesel generators ensure uninterrupted power throughout your event, so lighting, sound, and air-conditioning never miss a beat.",
    image: facilityGenset,
    alt: "Power backup generator (genset) at A.R Grand",
  },
  {
    icon: Snowflake,
    title: "Fully Air-Conditioned Hall",
    description:
      "The entire hall is centrally air-conditioned, keeping every guest cool and comfortable in any season — perfect for Chennai weather.",
    image: facilityAcHall,
    alt: "Fully air-conditioned wedding hall interior",
  },
  {
    icon: DoorClosed,
    title: "Private Room",
    description:
      "Elegantly furnished private rooms for the bride, groom, and family — ideal for getting ready, freshening up, and relaxing between ceremonies.",
    image: facilityPrivateRoom,
    alt: "Private bridal room with elegant furnishings",
  },
  {
    icon: ChefHat,
    title: "Separate Cooking Area",
    description:
      "A dedicated, fully-equipped commercial kitchen lets your caterers prepare fresh meals on-site without disturbing the celebration.",
    image: facilityKitchen,
    alt: "Separate commercial cooking area / kitchen",
  },
];

const Facilities = () => (
  <div className="pt-20">
    <SEO
      title="Facilities & Amenities · A.R Grand Marriage Hall Chennai"
      description="Lifts, AC halls, ample parking, generator backup, bridal rooms & kitchen. Every amenity for your wedding at A.R Grand, Kodungaiyur Chennai."
      path="/facilities"
    />
    <section className="section-padding pb-36 sm:pb-28 md:pb-24 max-w-7xl mx-auto">
      <h1 className="heading-xl text-center text-foreground mb-4">Our Facilities</h1>
      <p className="text-body text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
        A.R Grand is fully equipped with everything needed to host a flawless celebration — from comfort and convenience to safety and service.
      </p>

      <div className="flex flex-col gap-16">
        {facilities.map((f, i) => (
          <div
            key={f.title}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
          >
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src={f.image}
                alt={f.alt}
                width={1024}
                height={768}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <f.icon className="text-primary" size={26} />
              </div>
              <h2 className="heading-lg text-foreground mb-4">{f.title}</h2>
              <p className="text-body text-muted-foreground">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default Facilities;
