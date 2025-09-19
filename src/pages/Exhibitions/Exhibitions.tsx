import SectionHeader from '../../components/SectionHeader/SectionHeader';
import { exhibitions } from '../../data/exhibitions';
import styles from './Exhibitions.module.css';

const Exhibitions = () => {
  const upcomingShow = exhibitions[0];
  const pastShows = exhibitions.slice(1);

  const groupByYear = pastShows.reduce<Record<string, typeof pastShows>>((accumulator, show) => {
    if (!accumulator[show.year]) {
      accumulator[show.year] = [];
    }
    accumulator[show.year].push(show);
    return accumulator;
  }, {});

  const years = Object.keys(groupByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <SectionHeader
            overline="Exhibitions"
            title="Where the work has lived"
            description="Solo and group exhibitions tracing the evolution of Darby’s drawing practice across the Pacific
              Northwest and beyond."
          />
          {upcomingShow ? (
            <div className={styles.upcomingCard}>
              <div>
                <p className={styles.cardLabel}>Upcoming</p>
                <h3>{upcomingShow.title}</h3>
                <p>{upcomingShow.venue}</p>
                <p className={styles.upcomingLocation}>{upcomingShow.location}</p>
                {upcomingShow.notes ? <p className={styles.upcomingNotes}>{upcomingShow.notes}</p> : null}
              </div>
              <div className={styles.yearBadge}>{upcomingShow.year}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="container">
          <div className={styles.grid}>
            {years.map((year) => (
              <div key={year} className={styles.yearColumn}>
                <h4>{year}</h4>
                <ul>
                  {groupByYear[year].map((show) => (
                    <li key={show.id}>
                      <div>
                        <p className={styles.title}>{show.title}</p>
                        <p>{show.venue}</p>
                        <span className={styles.type}>{show.type}</span>
                      </div>
                      <p className={styles.location}>{show.location}</p>
                      {show.notes ? <p className={styles.notes}>{show.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Exhibitions;
