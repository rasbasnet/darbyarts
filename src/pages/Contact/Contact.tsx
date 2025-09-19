import { FormEvent } from 'react';
import styles from './Contact.module.css';

const Contact = () => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') ?? '').toString();
    const email = (formData.get('email') ?? '').toString();
    const message = (formData.get('message') ?? '').toString();
    const subject = encodeURIComponent('Darby Mitchell Studio Inquiry');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:studio@darbymitchell.art?subject=${subject}&body=${body}`;
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.intro}>
            <p className={styles.overline}>Contact</p>
            <h1>Studio visits, acquisitions, collaborations.</h1>
            <p>
              Darby accepts a limited number of commissions yearly and welcomes invitations for exhibitions, artist talks,
              and interdisciplinary collaborations. Please share as many details as possible so the studio can respond
              thoughtfully.
            </p>
            <div className={styles.details}>
              <p>
                <strong>Email</strong>
                <a href="mailto:studio@darbymitchell.art">studio@darbymitchell.art</a>
              </p>
              <p>
                <strong>Instagram</strong>
                <a href="https://www.instagram.com/darbymitchell.art" target="_blank" rel="noreferrer">
                  @darbymitchell.art
                </a>
              </p>
              <p>
                <strong>Studio</strong>
                <span>Located in Portland, Oregon. Visits by appointment.</span>
              </p>
            </div>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required placeholder="Your name" />

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="you@email.com" />

            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={6} placeholder="Tell us about the project or inquiry." />

            <button type="submit">Compose email</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
