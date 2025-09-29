import SectionHeader from '../../components/SectionHeader/SectionHeader';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import { artworks } from '../../data/artworks';
import { collectionMetadata } from '../../data/collections';
import { embodiedArchive } from '../../data/archivalWorks';
import styles from './Artwork.module.css';

const Artwork = () => (
  <div className={styles.page}>
    {collectionMetadata.map((collection, index) => {
      const items = artworks.filter((artwork) => artwork.collection === collection.id);
      const isArchive = collection.id === 'embodied';

      return (
        <section key={collection.id} className={styles.collectionSection}>
          <div className="container">
            <div className={styles.collectionIntro}>
              <SectionHeader
                overline={index === 0 ? 'Catalogue' : 'Archive'}
                title={`${collection.title} (${collection.years})`}
                description={collection.statement[0]}
                tone="dark"
              />
              {collection.statement.slice(1).map((paragraph) => (
                <p key={paragraph} className={styles.collectionParagraph}>{paragraph}</p>
              ))}
            </div>

            <div className={styles.notesGrid}>
              <article>
                <h3>Materials & process</h3>
                <p>{collection.materialsProcess}</p>
              </article>
              <article>
                <h3>Series threads</h3>
                <p>{collection.seriesThreads}</p>
              </article>
              <article>
                <h3>Acquisitions</h3>
                <p>{collection.acquisitions}</p>
                {collection.downloadUrl ? (
                  <a href={collection.downloadUrl} className={styles.downloadLink} target="_blank" rel="noreferrer">
                    {collection.downloadLabel ?? 'Download exhibition packet'}
                  </a>
                ) : null}
              </article>
            </div>
          </div>

          <div className={`${styles.collectionBody} ${isArchive ? styles.archiveBody : ''}`}>
            <div className="container">
              {items.length > 0 ? (
                <GalleryGrid items={items} dense />
              ) : (
                <div className={styles.archiveList}>
                  <h4>Works included</h4>
                  <ul>
                    {embodiedArchive.map((work) => (
                      <li key={work.title}>
                        <span className={styles.archiveTitle}>{work.title}</span>
                        <span>{work.medium}</span>
                        <span>{work.size}</span>
                        <span>{work.year}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    })}
  </div>
);

export default Artwork;
