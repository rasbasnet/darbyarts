import { Link } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { artworks } from '../../data/artworks';
import { profile } from '../../data/profile';
import { resolveAssetPath } from '../../utils/media';
import styles from './About.module.css';

const portrait = artworks.find((item) => item.id === 'summer-self-portrait-2') ?? artworks[0];
const deckUrl = resolveAssetPath('files/Artist Deck [Final].pdf');

const practiceMotifs = [
  {
    title: 'Seductive armour',
    description:
      'Candy pink becomes a shield. Saturated grounds invite viewers to linger in scenes that might otherwise repel—sugar coating the bite of social anxiety.'
  },
  {
    title: 'Bodies as instruments',
    description:
      'Graphite structures each muscle. Cosmetics, pastel, and gesso sink into paper like blush on skin, rehearsing appetite, language, and release.'
  }
];

const About = () => {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <figure className={styles.heroImage}>
              <img src={portrait.image} alt={portrait.alt} />
              <figcaption>
                <span>{portrait.title}</span>
                <span>{portrait.year}</span>
              </figcaption>
            </figure>

            <div className={styles.heroCopy}>
              <span className={styles.overline}>About the artist</span>
              <h1>{profile.name}</h1>
              <p className={styles.lead}>{profile.tagline}</p>
              <p>{profile.bio[0]}</p>
              <div className={styles.pillars}>
                {practiceMotifs.map((motif) => (
                  <article key={motif.title} className={styles.pillar}>
                    <h3>{motif.title}</h3>
                    <p>{motif.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className={styles.quickFacts}>
              <div className={styles.contactBlock}>
                <span>Connect</span>
                <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
                <a href="tel:+17044377979">{profile.contact.phone}</a>
                <a href={profile.contact.instagram} target="_blank" rel="noreferrer">
                  @darbymitchell.art
                </a>
              </div>
              <div className={styles.contactBlock}>
                <span>Location</span>
                <p>{profile.contact.location}</p>
              </div>
              <a href={deckUrl} className={styles.deckLink} download>
                Download artist deck
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.bioSection}>
        <div className="container">
          <div className={styles.bioGrid}>
            <SectionHeader
              overline="Practice"
              title="Drawing the seam between performance and tenderness"
              description={profile.bio[1]}
              tone="dark"
            />
            <div className={styles.bioBody}>
              <p>
                Studio research embraces live performance, gig posters, and graphite rituals—treating drawing as both
                rehearsal and reveal. Collaboration with musicians and galleries keeps the work porous, allowing new
                audiences to enter the candy-coated unease.
              </p>
              <div className={styles.cvGrid}>
                <div>
                  <h3>Education</h3>
                  <ul>
                    {profile.education.map((entry) => (
                      <li key={`${entry.year}-${entry.program}`}>
                        <span>{entry.year}</span>
                        <span>{entry.program}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Awards & Scholarships</h3>
                  <ul>
                    {profile.awards.map((award) => (
                      <li key={`${award.year}-${award.title}`}>
                        <span>{award.year}</span>
                        <span>
                          {award.title}
                          {award.notes ? <em> — {award.notes}</em> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link to="/contact" className={styles.ctaLink}>
                Contact the studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.processSection}>
        <div className="container">
          <SectionHeader
            overline="Process notes"
            title="Bodies as portals, diagrams as confession"
            description="Field notes pulled from the artist deck and exhibition essays."
            tone="dark"
          />
          <div className={styles.processGrid}>
            <blockquote>
              <p>
                Medical illustration has always been a way of conveying factual information about the body. This series gives
                conceptual meaning to those otherwise sterile associations, recontextualising science to explore sentiment.
                Put simply, it represents the literal embodiment of feeling.
              </p>
              <cite>— Embodied: An Anatomical Exploration of Inner Narrative, 2021</cite>
            </blockquote>
            <blockquote>
              <p>
                Eat Me began as a meditation on vulnerability through self-portraiture. Over time it dared the viewer to
                engage with the body-as-vessel, trapping them in candy-pink space while a spoon hovers above an impossible
                offering.
              </p>
              <cite>— CONTRAST: Thornback Gallery, 2025</cite>
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
