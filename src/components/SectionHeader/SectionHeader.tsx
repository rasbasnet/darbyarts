import styles from './SectionHeader.module.css';

type SectionHeaderProps = {
  overline?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

const SectionHeader = ({ overline, title, description, align = 'left' }: SectionHeaderProps) => (
  <header className={`${styles.header} ${styles[align]}`}>
    {overline ? <p className={styles.overline}>{overline}</p> : null}
    <h2 className={styles.title}>{title}</h2>
    {description ? <p className={styles.description}>{description}</p> : null}
  </header>
);

export default SectionHeader;
