import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { artworks } from '../../data/artworks';
import { exhibitions } from '../../data/exhibitions';
import { profile } from '../../data/profile';
import styles from './Home.module.css';

const heroArtwork = artworks.find((item) => item.id === 'eat-me') ?? artworks[0];
const featuredArtworks = artworks.slice(0, 6);
const publicUrl = process.env.PUBLIC_URL ?? '';
const deckUrl = publicUrl
  ? `${publicUrl}${publicUrl.endsWith('/') ? '' : '/'}files/Artist Deck [Final].pdf`
  : '/files/Artist Deck [Final].pdf';

const Home = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const elements = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-reveal>
            <span className={styles.overline}>Darby Mitchell</span>
            <h1>{profile.tagline}</h1>
            <p>{profile.statement[0]}</p>
            <p>{profile.statement[1]}</p>
            <div className={styles.heroActions}>
              <Link to="/artwork" className={styles.primaryButton}>
                Browse recent work
              </Link>
              <a href={deckUrl} className={styles.secondaryButton} download>
                Download artist deck
              </a>
            </div>
          </div>
          <Link to={`/artwork/${heroArtwork.id}`} className={styles.heroArtwork} data-reveal>
            <img src={heroArtwork.image} alt={heroArtwork.alt} />
            <span className={styles.heroArtworkMeta}>
              <span>{heroArtwork.title}</span>
              <span>{heroArtwork.year}</span>
            </span>
          </Link>
        </div>
      </div>
    </section>

    <section className={styles.worksSection}>
      <div className="container" data-reveal>
        <SectionHeader
          overline="Selected works"
          title="Bodies held in candy-coated tension"
          description="Drawings and painted objects from 2023–2025 that sugarcoat unease, moving between graphite precision and saturated cosmetic color."
          align="center"
        />
        <GalleryGrid items={featuredArtworks} size="large" />
      </div>
    </section>

    <section className={styles.statementSection}>
      <div className="container" data-reveal>
        <div className={styles.statementGrid}>
          <SectionHeader
            overline="Artist statement"
            title="Cloaking everyday horrors in pink"
            description={profile.statement[2]}
          />
          <div className={styles.statementBody}>
            <p>{profile.bio[0]}</p>
            <p>{profile.bio[1]}</p>
            <Link to="/about" className={styles.inlineLink}>
              Read the full biography and CV
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.exhibitionsSection}>
      <div className="container" data-reveal>
        <SectionHeader
          overline="Exhibitions"
          title="Recent showings"
          description="Highlights from solo projects, residencies, and juried selections." align="center"
        />
        <div className={styles.exhibitionsList}>
          {exhibitions.map((show) => (
            <Link key={show.id} to={`/exhibitions/${show.slug}`} className={styles.exhibitionCard} data-reveal>
              <div>
                <p className={styles.exhibitionYear}>{show.year}</p>
                <h3>{show.title}</h3>
                <p className={styles.exhibitionVenue}>{show.venue}</p>
                <p className={styles.exhibitionLocation}>{show.location}</p>
              </div>
              {show.notes ? <p className={styles.exhibitionNotes}>{show.notes}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className={styles.contactSection}>
      <div className="container" data-reveal>
        <div className={styles.contactCard}>
          <h2>Studio inquiries</h2>
          <p>
            For exhibitions, acquisitions, or to schedule a studio visit, please get in touch. A full PDF deck and
            additional materials are available on request.
          </p>
          <div className={styles.contactGrid}>
            <div>
              <span>Email</span>
              <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
            </div>
            <div>
              <span>Phone</span>
              <a href="tel:+17044377979">{profile.contact.phone}</a>
            </div>
            <div>
              <span>Instagram</span>
              <a href={profile.contact.instagram} target="_blank" rel="noreferrer">
                @darbymitchell.art
              </a>
            </div>
          </div>
          <Link to="/contact" className={styles.primaryButton}>
            Contact the studio
          </Link>
        </div>
      </div>
    </section>
    </>
  );
};

export default Home;
