import { Link } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { exhibitionsWithDetails } from '../../data/exhibitionDetails';
import styles from './Exhibitions.module.css';

const Exhibitions = () => (
  <div className={styles.page}>
    <section className={styles.hero}>
      <div className="container">
        <SectionHeader
          overline="Exhibitions & Residencies"
          title="Tracing appetite through public encounters"
          description="From juried exhibitions to long-form research residencies, these moments chart how the work meets viewers beyond the studio."
          spacing="compact"
        />
      </div>
    </section>
    <section className={styles.showcase}>
      <div className="container">
        <div className={styles.list}>
          {exhibitionsWithDetails.map(({ detail, ...show }) => (
            <Link key={show.id} to={`/exhibitions/${show.slug}`} className={styles.card}>
              <header>
                <span className={styles.year}>{show.year}</span>
                <h3>{show.title}</h3>
                <p>{show.venue}</p>
                <p className={styles.location}>{show.location}</p>
              </header>
              <span className={styles.badge}>{show.type}</span>
              {show.notes ? <p className={styles.notes}>{show.notes}</p> : null}
              {detail?.summary ? <p className={styles.preview}>{detail.summary}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Exhibitions;
