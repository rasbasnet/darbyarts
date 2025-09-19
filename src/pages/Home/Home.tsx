import { Link } from 'react-router-dom';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import HeroCollage from '../../components/HeroCollage/HeroCollage';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { artworks } from '../../data/artworks';
import { exhibitions } from '../../data/exhibitions';
import styles from './Home.module.css';

const featuredArtworks = artworks.slice(0, 3);

const Home = () => (
  <>
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.heroOverline}>Graphite ∙ Flesh ∙ Memory</p>
            <h1 className={styles.heroTitle}>
              Observing the mouth as a vessel for hunger, speech, and intimacy.
            </h1>
            <p className={styles.heroBody}>
              Darby Mitchell’s drawings hover between clinical study and tender confession. Graphite articulates
              the anatomy; blush floods the emotional register.
            </p>
            <div className={styles.heroActions}>
              <Link to="/artwork" className={styles.primaryButton}>
                View Artwork
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <HeroCollage items={artworks} />
          </div>
        </div>
      </div>
    </section>

    <section>
      <div className="container">
        <SectionHeader
          overline="Latest work"
          title="Drawings that oscillate between tenderness and bite."
          description="Graphite captures the discipline of anatomy; pastel blushes in the vulnerability. Works are
            available for acquisition through direct studio inquiry."
        />
        <GalleryGrid items={featuredArtworks} size="large" />
      </div>
    </section>

    <section className={styles.statementSection}>
      <div className="container">
        <div className={styles.statementGrid}>
          <div>
            <SectionHeader
              overline="Artist statement"
              title="Tracing appetite and articulation through the mouth."
              description="My practice interrogates how we speak, consume, and withhold. I begin in graphite to map
                the muscle memory of expression. A single blush of pink becomes the pulse of the piece—an exposed nerve, a
                chorus of quiet noise."
            />
          </div>
          <div className={styles.statementBody}>
            <p>
              The drawings live in the liminal space between portraiture and diagram. I work with sitters who are part of
              queer and neurodivergent communities, documenting how language fails our bodies and how ritual pulls us
              back. Each piece is an invitation to linger on the physical mechanics of yearning: the bite, the swallow,
              the breath held behind the teeth.
            </p>
            <p>
              Process-wise, I build dense graphite layers, erase back to skin, and then reintroduce color through thin
              pastel washes. This cycle mirrors repetition and rehearsal—a way to witness how the body keeps score of what
              we ask it to hold.
            </p>
            <Link to="/about" className={styles.inlineLink}>
              Read the full biography
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div className="container">
        <SectionHeader
          overline="Exhibitions"
          title="Recent and upcoming presentations"
          description="Darby’s work continues to travel through drawing-focused galleries and intimate viewing
            rooms."
        />
        <div className={styles.exhibitionsList}>
          {exhibitions.map((show) => (
            <article key={show.id} className={styles.exhibitionCard}>
              <div>
                <p className={styles.exhibitionYear}>{show.year}</p>
                <h3>{show.title}</h3>
                <p>{show.venue}</p>
                <p className={styles.location}>{show.location}</p>
              </div>
              <div className={styles.exhibitionMeta}>
                <span className={styles.typeBadge}>{show.type}</span>
                {show.notes ? <p>{show.notes}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className={styles.calloutSection}>
      <div className="container">
        <div className={styles.calloutCard}>
          <div>
            <h2>For studio visits and acquisitions</h2>
            <p>
              Private viewings are available by appointment in Portland and via virtual walkthrough. Please reach out for
              catalogue PDFs, press assets, or collaboration inquiries.
            </p>
          </div>
          <Link to="/contact" className={styles.primaryButton}>
            Connect with the studio
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default Home;
