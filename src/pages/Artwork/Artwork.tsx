import SectionHeader from '../../components/SectionHeader/SectionHeader';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import { artworks } from '../../data/artworks';
import styles from './Artwork.module.css';

const Artwork = () => (
  <div className={styles.page}>
    <section className={styles.intro}>
      <div className="container">
        <SectionHeader
          overline="Catalogue"
          title="Sugar-coated apparitions"
          description="This collection spans 2023–2025, pairing graphite discipline with cosmetic color. Each work is an isolated meditation on hunger, perception, and the labour of performance."
        />
        <div className={styles.processNotes}>
          <div>
            <h3>Materials & process</h3>
            <p>
              Drawings begin with tight graphite or charcoal foundations before layers of gesso, pastel, and expired
              cosmetics are buffed in. The result is a surface that feels both clinical and confectionary.
            </p>
          </div>
          <div>
            <h3>Series threads</h3>
            <p>
              Works from <em>Performative Appetites</em> and <em>Portals</em> consider the mouth as both an invitation and a
              dare. Earlier anatomical pieces reimagine medical illustration as a map for feeling.
            </p>
          </div>
          <div>
            <h3>Acquisitions</h3>
            <p>
              Originals and select editions are available directly through the studio. Contact for availability or to
              request additional documentation.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div className="container">
        <GalleryGrid items={artworks} dense />
      </div>
    </section>
  </div>
);

export default Artwork;
