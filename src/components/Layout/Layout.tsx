import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../Footer/Footer';
import Navigation from '../Navigation/Navigation';
import styles from './Layout.module.css';

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const updateScrollTint = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const hue = 330 + ratio * 40;
      const accent = `hsla(${hue.toFixed(2)}, 80%, 86%, 0.56)`;
      const shadow = `hsla(${(hue + 210).toFixed(2)}, 42%, 24%, 0.25)`;
      document.documentElement.style.setProperty('--scroll-accent', accent);
      document.documentElement.style.setProperty('--scroll-shadow', shadow);
    };

    updateScrollTint();
    window.addEventListener('scroll', updateScrollTint, { passive: true });
    window.addEventListener('resize', updateScrollTint);

    return () => {
      window.removeEventListener('scroll', updateScrollTint);
      window.removeEventListener('resize', updateScrollTint);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <Navigation />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
