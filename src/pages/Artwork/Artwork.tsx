import { CSSProperties, useEffect, useRef } from 'react';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid';
import { artworks } from '../../data/artworks';
import { collectionMetadata } from '../../data/collections';
import { embodiedArchive } from '../../data/archivalWorks';
import styles from './Artwork.module.css';

type CollectionTheme = {
  backgroundStart: string;
  backgroundEnd: string;
  halo: string;
  sectionBorder: string;
  sectionSurface: string;
};

const collectionThemes: Record<string, CollectionTheme> = {
  'sugar-coated-apparitions': {
    backgroundStart: 'rgba(255, 244, 249, 0.88)',
    backgroundEnd: 'rgba(244, 196, 214, 0.65)',
    halo: 'radial-gradient(circle at 18% 18%, rgba(255, 209, 227, 0.55), transparent 62%)',
    sectionBorder: 'rgba(255, 215, 230, 0.6)',
    sectionSurface: 'rgba(255, 255, 255, 0.35)'
  },
  embodied: {
    backgroundStart: 'rgba(214, 224, 235, 0.82)',
    backgroundEnd: 'rgba(168, 184, 202, 0.78)',
    halo: 'radial-gradient(circle at 80% 20%, rgba(188, 204, 221, 0.6), transparent 65%)',
    sectionBorder: 'rgba(174, 192, 213, 0.6)',
    sectionSurface: 'rgba(236, 242, 249, 0.32)'
  }
};

const Artwork = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    const sections = Array.from(page.querySelectorAll('[data-collection]')) as HTMLElement[];
    if (!sections.length) {
      return;
    }

    const applyTheme = (theme: CollectionTheme | undefined) => {
      const activeTheme = theme ?? collectionThemes['sugar-coated-apparitions'];
      page.style.setProperty('--artwork-bg-start', activeTheme.backgroundStart);
      page.style.setProperty('--artwork-bg-end', activeTheme.backgroundEnd);
      page.style.setProperty('--artwork-halo', activeTheme.halo);
    };

    applyTheme(collectionThemes[sections[0].dataset.collection ?? 'sugar-coated-apparitions']);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        if (visible.length > 0) {
          const target = visible[0].target as HTMLElement;
          const theme = collectionThemes[target.dataset.collection ?? ''];
          applyTheme(theme);
        }
      },
      { root: null, threshold: [0.2, 0.35, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      {collectionMetadata.map((collection, index) => {
        const items = artworks.filter((artwork) => artwork.collection === collection.id);
        const isArchive = collection.id === 'embodied';
        const theme = collectionThemes[collection.id] ?? collectionThemes['sugar-coated-apparitions'];

        const sectionStyle: CSSProperties = {
          '--section-border': theme.sectionBorder,
          '--section-surface': theme.sectionSurface
        } as CSSProperties;

        return (
          <section
            key={collection.id}
            className={styles.collectionSection}
            data-collection={collection.id}
            style={sectionStyle}
          >
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
};

export default Artwork;
