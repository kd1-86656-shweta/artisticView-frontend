/** Public-domain masterpieces used as backdrops, with a museum-style credit. Files live in /public/art. */
export const ARTWORKS = {
  poppies: { src: '/art/poppy-field.jpg', artist: 'Claude Monet', title: 'Poppy Field', year: 1873, position: '50% 60%' },
  parasol: { src: '/art/woman-with-parasol.jpg', artist: 'Claude Monet', title: 'Woman with a Parasol', year: 1875, position: '50% 35%' },
  starry: { src: '/art/starry-night.jpg', artist: 'Vincent van Gogh', title: 'The Starry Night', year: 1889, position: '50% 40%' },
  almond: { src: '/art/almond-blossom.jpg', artist: 'Vincent van Gogh', title: 'Almond Blossom', year: 1890, position: '50% 40%' },
  boating: { src: '/art/boating-party.jpg', artist: 'Pierre-Auguste Renoir', title: 'Luncheon of the Boating Party', year: 1881, position: '45% 55%' },
  galette: { src: '/art/moulin-galette.jpg', artist: 'Pierre-Auguste Renoir', title: 'Dance at Le Moulin de la Galette', year: 1876, position: '40% 55%' },
};

export type ArtworkKey = keyof typeof ARTWORKS;

/** Fills its (position: relative) parent with the painting; the credit sits in a corner like a gallery label. */
export default function Artwork({ art, credit = true, className = '' }: { art: ArtworkKey; credit?: boolean; className?: string }) {
  const a = ARTWORKS[art];
  return (
    <figure className={`artwork ${className}`}>
      <img src={a.src} alt={`${a.title} by ${a.artist}`} style={{ objectPosition: a.position }} loading={art === 'poppies' ? 'eager' : 'lazy'} />
      {credit && (
        <figcaption className="artwork__credit">
          <strong>{a.artist}</strong> · <em>{a.title}</em>, {a.year}
        </figcaption>
      )}
    </figure>
  );
}
