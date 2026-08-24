import { useState } from 'react';
import { publicApi } from '../../services/api';

export default function ContactForm({ withSubject = false, withPhone = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const res = await publicApi.contact({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || 'Website inquiry',
        message: form.message,
      });
      setError(false);
      setStatus(res.message || 'Message received');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(true);
      setStatus(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="flex flex-col gap-2.5" onSubmit={submit} noValidate>
      <input className="public-input" value={form.name} onChange={setField('name')} placeholder="Full Name" required />
      <input className="public-input" type="email" value={form.email} onChange={setField('email')} placeholder="Email" required />
      {withSubject ? (
        <input className="public-input" value={form.subject} onChange={setField('subject')} placeholder="Subject" required />
      ) : null}
      {withPhone ? (
        <input className="public-input" type="tel" value={form.phone} onChange={setField('phone')} placeholder="Phone Number" />
      ) : null}
      <textarea
        className="public-textarea"
        value={form.message}
        onChange={setField('message')}
        placeholder={withSubject ? 'Your Message' : 'Message'}
        rows={withSubject ? 5 : 5}
        required
      />
      {status ? (
        <div className={`rounded px-3 py-2 text-sm ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {status}
        </div>
      ) : null}
      <button type="submit" className="public-btn-brown" disabled={sending}>
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
