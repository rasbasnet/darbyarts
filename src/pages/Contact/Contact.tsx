import { FormEvent } from 'react';
import { profile } from '../../data/profile';
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
    window.location.href = `mailto:${profile.contact.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.intro}>
            <p className={styles.overline}>Contact</p>
            <h1>Let’s co-create tender, sugar-coated worlds.</h1>
            <p>
              For exhibitions, acquisitions, interviews, or studio visits, reach out directly using the form or contact
              details below. Full project decks and high-resolution images are available on request.
            </p>
            <div className={styles.details}>
              <p>
                <strong>Email</strong>
                <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
              </p>
              <p>
                <strong>Phone</strong>
                <a href="tel:+17044377979">{profile.contact.phone}</a>
              </p>
              <p>
                <strong>Instagram</strong>
                <a href={profile.contact.instagram} target="_blank" rel="noreferrer">
                  @darbymitchell.art
                </a>
              </p>
            </div>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" required placeholder="Your name" />

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="you@email.com" />

            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={8} placeholder="Tell me about the project or inquiry." />

            <button type="submit">Send message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
