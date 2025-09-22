import styles from './SectionHeader.module.css';

type SectionHeaderProps = {
  overline?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  spacing?: 'default' | 'compact';
};

const SectionHeader = ({ overline, title, description, align = 'left', tone = 'dark', spacing = 'default' }: SectionHeaderProps) => (
  <header className={`${styles.header} ${styles[align]} ${styles[tone]} ${spacing === 'compact' ? styles.compact : ''}`.trim()}>
    {overline ? <p className={styles.overline}>{overline}</p> : null}
    <h2 className={styles.title}>{title}</h2>
    {description ? <p className={styles.description}>{description}</p> : null}
  </header>
);

export default SectionHeader;
