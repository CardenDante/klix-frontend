import { SectionTitle } from './section-title';

const PARTNERS = [
  { name: 'Chacha', logo: '/partners/chacha.svg' },
  { name: 'Safaricom M-Pesa', logo: '/M-PESA.png' },
  { name: 'Google', logo: '/partners/google.webp' },
];

export function PartnersSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <SectionTitle accent="Partners" className="mb-12">
          Our
        </SectionTitle>
        <div className="mx-auto grid max-w-4xl grid-cols-3 items-center gap-10">
          {PARTNERS.map((p) => (
            <div key={p.name} className="flex justify-center">
              <img
                src={p.logo}
                alt={p.name}
                loading="lazy"
                className="h-12 w-32 object-contain grayscale transition-all duration-300 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
