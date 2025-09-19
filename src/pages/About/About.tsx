import SectionHeader from '../../components/SectionHeader/SectionHeader';
import styles from './About.module.css';

const About = () => (
  <div className={styles.page}>
    <section className={styles.hero}> 
      <div className="container">
        <div className={styles.heroGrid}>
          <div>
            <SectionHeader
              overline="About"
              title="Darby Mitchell"
              description="Darby Mitchell (b. 1994) is a Portland-based figurative artist working in drawing, painting,
                and installation. Her practice focuses on the mouth as a site of appetite, resistance, and language."
            />
          </div>
          <div className={styles.portraitCard}>
            <div className={styles.portraitMask}>
              <div className={styles.gradientRing} />
              <div className={styles.portraitGlow} />
            </div>
            <p className={styles.caption}>
              “I draw the body like a rehearsal. The mouth remembers the phrases our muscles hold even after the words
              have slipped.”
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div className="container">
        <div className={styles.bioGrid}>
          <div>
            <h3>Biography</h3>
            <p>
              Darby studied drawing and social practice at the Pacific Northwest College of Art (BFA, 2017) and pursued
              graduate research at Cranbrook Academy of Art (MFA, 2020). She has been awarded residencies across the West
              Coast, with recent fellowships at Sound House (2022) and the Watershed Collective (2021).
            </p>
            <p>
              Her work appears in New American Paintings (Issue 164) and has been featured by Hyperallergic for the solo
              exhibition <em>Crave</em>. Collections include the Portland Art Museum Viewing Drawers and numerous private
              holdings in North America.
            </p>
            <p>
              Mitchell’s studio practice extends into collaborative performance, partnering with choreographers and sound
              designers to explore how the mouth modulates both speech and song. She currently teaches advanced drawing at
              the Pacific Northwest College of Art.
            </p>
          </div>
          <div className={styles.quickFacts}>
            <div>
              <h4>Education</h4>
              <ul>
                <li>MFA, Drawing—Cranbrook Academy of Art, 2020</li>
                <li>BFA, Intermedia & Drawing—Pacific Northwest College of Art, 2017</li>
              </ul>
            </div>
            <div>
              <h4>Residencies & Awards</h4>
              <ul>
                <li>Sound House Residency, Taos, NM, 2022</li>
                <li>Watershed Collective Fellowship, 2021</li>
                <li>Oregon Arts Commission Career Opportunity Grant, 2020</li>
              </ul>
            </div>
            <div>
              <h4>Press</h4>
              <ul>
                <li>Hyperallergic — “Bodies in Blush” (Feature, 2023)</li>
                <li>New American Paintings — Pacific Northwest Issue No. 164</li>
                <li>KRONOS Radio — Interview on hunger and ritual, 2022</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.timelineSection}>
      <div className="container">
        <h3>Selected timeline</h3>
        <ul className={styles.timeline}>
          <li>
            <span>2025</span>
            <p>Upcoming solo exhibition <em>FLUX: Bodies in Bloom</em>, Cobalt Gallery, Portland, OR.</p>
          </li>
          <li>
            <span>2024</span>
            <p>Group exhibition <em>Surface Study</em>, Glass Box Contemporary, Seattle, WA.</p>
          </li>
          <li>
            <span>2023</span>
            <p>Solo exhibition <em>Crave</em>, Studio 4A, Chicago, IL; published in Hyperallergic.</p>
          </li>
          <li>
            <span>2022</span>
            <p>Sound House Residency, Taos, NM; new series <em>Anatomies of Tenderness</em> begins.</p>
          </li>
          <li>
            <span>2020</span>
            <p>Graduated from Cranbrook Academy of Art; awarded Oregon Arts Commission Career Opportunity Grant.</p>
          </li>
        </ul>
      </div>
    </section>
  </div>
);

export default About;
