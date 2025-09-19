import SectionHeader from '../../components/SectionHeader/SectionHeader';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import { artworks } from '../../data/artworks';
import styles from './Artwork.module.css';

const Artwork = () => (
  <div className={styles.page}>
    <section className={styles.intro}>
      <div className="container">
        <SectionHeader
          overline="Artwork"
          title="Bodies in graphite, flushed with blush."
          description="Each drawing begins with rigorous observation—hands, mouths, tendons in repeat. Pink is the
            interruption: an emotional register that refuses to stay silent."
        />
        <div className={styles.processNotes}>
          <div>
            <h3>Materials & approach</h3>
            <p>
              Works are drawn on heavyweight cotton rag or wood panel. Graphite lays the structure, erased and redrawn
              until the gesture feels inevitable. Pastel pushes from beneath, seeping through negative space like breath.
            </p>
          </div>
          <div>
            <h3>On series</h3>
            <p>
              Collections develop through repetition—each sitter revisited across multiple sessions. Series such as
              <em> Bite</em> and <em>Anatomies of Tenderness</em> examine how the mouth holds both vocabulary and appetite.
            </p>
          </div>
          <div>
            <h3>Availability</h3>
            <p>
              Select originals and limited edition pigment prints are available. Detailed catalogue PDFs and pricing are
              provided on request.
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
