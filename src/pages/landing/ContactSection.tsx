import { useState, type FormEvent } from 'react';
import Artwork from '@/components/common/Artwork';
import { APP_NAME, CONTACT_ADDRESS, CONTACT_EMAIL } from '@/config/app';

/** Same layout as the agasty.ai contact page: "What to expect" card on the left, "Get in Touch" form on the right. */

type Field = 'name' | 'phoneNumber' | 'emailId' | 'city' | 'communityName' | 'role' | 'message';
type Values = Record<Field, string>;

const FIELDS: { name: Exclude<Field, 'message'>; label: string; type?: string; inputMode?: 'tel' | 'email' }[] = [
  { name: 'name', label: 'Name' },
  { name: 'phoneNumber', label: 'Phone number', type: 'tel', inputMode: 'tel' },
  { name: 'emailId', label: 'Email', type: 'email', inputMode: 'email' },
  { name: 'city', label: 'City' },
  { name: 'communityName', label: 'Community / creator name' },
  { name: 'role', label: 'You are a' },
];

const ROLES = ['Creator / host', 'Community member', 'Brand / partner', 'Other'];

const ALPHA = /^[A-Za-z\s]+$/;
const EMPTY: Values = { name: '', phoneNumber: '', emailId: '', city: '', communityName: '', role: '', message: '' };

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!v.name.trim()) e.name = 'Name is required';
  else if (!ALPHA.test(v.name)) e.name = 'Only alphabets are allowed';
  if (!/^[0-9]{10}$/.test(v.phoneNumber)) e.phoneNumber = 'Phone number must be exactly 10 digits';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(v.emailId)) e.emailId = 'Invalid email address';
  if (!v.city.trim()) e.city = 'City is required';
  else if (!ALPHA.test(v.city)) e.city = 'Only alphabets are allowed';
  if (!v.communityName.trim()) e.communityName = 'Community / creator name is required';
  if (!v.role) e.role = 'Please choose one';
  if (!v.message.trim()) e.message = 'Message is required';
  return e;
}

export default function ContactSection() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSent(false);
  };

  // No contact API yet: open the visitor's mail app with everything filled in.
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = [
      `Name: ${values.name}`,
      `Phone: ${values.phoneNumber}`,
      `Email: ${values.emailId}`,
      `City: ${values.city}`,
      `Community / creator: ${values.communityName}`,
      `Role: ${values.role}`,
      '',
      values.message,
    ].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} enquiry from ${values.name}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setValues(EMPTY);
  };

  return (
    <section id="contact" className="lp-section pt-0">
      <div className="container">
        <div className="lp-contact lp-reveal">
          <div className="lp-contact__card lp-contact__expect">
            <h2>What to expect:</h2>
            <ul>
              <li><i className="bi bi-check2" />A quick, no-pressure chat with someone from the {APP_NAME} team</li>
              <li><i className="bi bi-check2" />Help setting up your community, rooms and first events</li>
              <li><i className="bi bi-check2" />See {APP_NAME} live and how it can bring your people together</li>
            </ul>
            <figure className="lp-contact__art m-0" aria-hidden="true">
              <Artwork art="parasol" credit={false} />
              <i className="bi bi-envelope-paper lp-contact__icon" />
              <figcaption>we&rsquo;d love to hear from you</figcaption>
            </figure>
          </div>

          <div className="lp-contact__card">
            <h2 className="text-center">Get in Touch</h2>
            <p className="lp-contact__sub">Fill out the form below and we will get back to you shortly.</p>
            {sent && (
              <div className="lp-contact__ok" role="status">
                <i className="bi bi-check-circle-fill" /> Thank you! Your mail app has opened with your message. Hit send and our team will contact you shortly.
              </div>
            )}
            <form onSubmit={submit} noValidate>
              <div className="lp-contact__grid">
                {FIELDS.map((f) => (
                  <label key={f.name} className="lp-field">
                    <span>{f.label}</span>
                    {f.name === 'role' ? (
                      <select value={values.role} onChange={(e) => set('role', e.target.value)} className={errors.role ? 'is-invalid' : ''}>
                        <option value="">Select one</option>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type ?? 'text'}
                        inputMode={f.inputMode}
                        value={values[f.name]}
                        maxLength={f.name === 'phoneNumber' ? 10 : 120}
                        placeholder={`Enter your ${f.label.toLowerCase()}`}
                        onChange={(e) => set(f.name, f.name === 'phoneNumber' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        className={errors[f.name] ? 'is-invalid' : ''}
                      />
                    )}
                    {errors[f.name] && <small className="lp-field__error">{errors[f.name]}</small>}
                  </label>
                ))}
              </div>
              <label className="lp-field">
                <span>Message</span>
                <textarea rows={4} value={values.message} placeholder="Enter your message"
                          onChange={(e) => set('message', e.target.value)} className={errors.message ? 'is-invalid' : ''} />
                {errors.message && <small className="lp-field__error">{errors.message}</small>}
              </label>
              <button type="submit" className="lp-btn lp-btn--join w-100 lp-btn--lg"><i className="bi bi-send" /> Send Message</button>
            </form>
            <div className="lp-contact__note">
              <p><strong>Note:</strong> Please expect a response within <strong>2 working days</strong>.</p>
              <p>Our team carefully reviews each request and will get back to you as soon as possible.</p>
              <p>If your request is urgent, feel free to <a href={`mailto:${CONTACT_EMAIL}`}>contact us</a> directly.</p>
              {CONTACT_ADDRESS && <p><strong>Address -</strong> {CONTACT_ADDRESS}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
