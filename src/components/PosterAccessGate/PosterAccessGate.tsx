import { FormEvent, ReactNode, useState } from 'react';
import { usePosterAccess } from '../../context/PosterAccessContext';
import styles from './PosterAccessGate.module.css';

type PosterAccessGateProps = {
  children: ReactNode;
};

const PosterAccessGate = ({ children }: PosterAccessGateProps) => {
  const { requiresAccess, hasAccess, verifyPassword, isVerifying, error, resetError } = usePosterAccess();
  const [password, setPassword] = useState('');

  if (!requiresAccess || hasAccess) {
    return <>{children}</>;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await verifyPassword(password);
  };

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <div className={styles.card}>
          <h1>Poster drop locked</h1>
          <p>Enter the test password to preview the poster store while private pricing is enabled.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                type="password"
                value={password}
                disabled={isVerifying}
                placeholder="Test password"
                onChange={(event) => {
                  if (error) {
                    resetError();
                  }
                  setPassword(event.currentTarget.value);
                }}
                aria-label="Test access password"
              />
              <button type="submit" disabled={isVerifying || password.trim().length === 0}>
                {isVerifying ? 'Checking…' : 'Unlock'}
              </button>
            </div>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </form>

          <p className={styles.note}>This gate only appears while the poster drop is password protected.</p>
        </div>
      </div>
    </div>
  );
};

export default PosterAccessGate;
