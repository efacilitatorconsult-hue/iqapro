import { useState } from 'react';

const PRICES = {
  solo: {
    monthly: { id: import.meta.env.VITE_STRIPE_SOLO_MONTHLY, amount: '£19', period: 'mo' },
    annual:  { id: import.meta.env.VITE_STRIPE_SOLO_ANNUAL,  amount: '£182', period: 'yr', perMonth: '£15' },
  },
  centre: {
    monthly: { id: import.meta.env.VITE_STRIPE_CENTRE_MONTHLY, amount: '£49', period: 'mo' },
    annual:  { id: import.meta.env.VITE_STRIPE_CENTRE_ANNUAL,  amount: '£470', period: 'yr', perMonth: '£39' },
  },
  enterprise: {
    monthly: { id: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY, amount: '£99', period: 'mo' },
    annual:  { id: import.meta.env.VITE_STRIPE_ENTERPRISE_ANNUAL,  amount: '£950', period: 'yr', perMonth: '£79' },
  },
};

const TIERS = [
  {
    key: 'solo',
    name: 'Solo',
    tagline: 'For freelance IQAs',
    color: '#38bdf8',
    features: [
      'Up to 3 assessors',
      'Up to 30 learners',
      'AI sampling plans',
      'Compliance reports',
      'Email support',
    ],
    missing: ['Auditor scheduling', 'Multi-site dashboard', 'Priority support'],
  },
  {
    key: 'centre',
    name: 'Centre',
    tagline: 'For training centres',
    color: '#818cf8',
    recommended: true,
    features: [
      'Up to 10 assessors',
      'Up to 150 learners',
      'AI sampling plans',
      'Compliance reports',
      'Auditor scheduling',
      'Team access (5 users)',
      'Email support',
    ],
    missing: ['Multi-site dashboard', 'Priority support'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'For colleges & multi-site',
    color: '#34d399',
    features: [
      'Unlimited assessors',
      'Unlimited learners',
      'AI sampling plans',
      'Compliance reports',
      'Auditor scheduling',
      'Unlimited users',
      'Multi-site dashboard',
      'Priority support',
    ],
    missing: [],
  },
];

export default function Pricing({ user, onCheckout, checkoutLoading, onBack }) {
  const [billing, setBilling] = useState('monthly');
  const [loadingTier, setLoadingTier] = useState(null);

  const handleSelect = async (tierKey) => {
    if (!onCheckout) return;
    const priceId = PRICES[tierKey][billing].id;
    setLoadingTier(tierKey);
    await onCheckout(priceId);
    setLoadingTier(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020817',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      padding: '0 1rem',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 20% 20%, rgba(56,189,248,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(129,140,248,0.07) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', paddingTop: '5rem', paddingBottom: '5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          {onBack && (
            <button onClick={onBack} style={{
              position: 'absolute', top: '2rem', left: '2rem',
              background: 'transparent', border: '1px solid #1e293b',
              color: '#64748b', padding: '0.5rem 1rem', borderRadius: 999,
              cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif",
            }}>
              ← Back
            </button>
          )}
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '1rem', fontWeight: 500 }}>
            iqapro pricing
          </p>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 400,
            color: '#f8fafc',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Simple pricing.<br />
            <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No surprises.</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            All plans include a 30-day free trial. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: 'inline-flex',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 999,
            padding: '0.25rem',
            gap: '0.25rem',
          }}>
            {['monthly', 'annual'].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s',
                  background: billing === b ? '#1e293b' : 'transparent',
                  color: billing === b ? '#f8fafc' : '#64748b',
                }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span style={{
                    marginLeft: '0.4rem',
                    fontSize: '0.7rem',
                    background: 'rgba(52,211,153,0.15)',
                    color: '#34d399',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 999,
                    fontWeight: 600,
                  }}>
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}>
          {TIERS.map((tier, i) => {
            const price = PRICES[tier.key][billing];
            const isLoading = loadingTier === tier.key;

            return (
              <div
                key={tier.key}
                style={{
                  position: 'relative',
                  background: tier.recommended ? '#0f172a' : '#080f1a',
                  border: `1px solid ${tier.recommended ? tier.color + '40' : '#1e293b'}`,
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  transform: tier.recommended ? 'translateY(-8px)' : 'none',
                  boxShadow: tier.recommended ? `0 0 60px ${tier.color}15` : 'none',
                  animation: `fadeUp 0.5s ease both`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <style>{`
                  @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(${tier.recommended ? '8px' : '16px'}); }
                    to { opacity: 1; transform: translateY(${tier.recommended ? '-8px' : '0'}); }
                  }
                `}</style>

                {tier.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: tier.color,
                    color: '#020817',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '0.3rem 1rem',
                    borderRadius: '0 0 0.75rem 0.75rem',
                  }}>
                    Most popular
                  </div>
                )}

                {/* Tier header */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: '0.75rem',
                    background: tier.color + '20',
                    border: `1px solid ${tier.color}40`,
                    marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: tier.color }} />
                  </div>
                  <p style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {tier.name}
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.875rem' }}>{tier.tagline}</p>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: '3rem',
                      fontWeight: 400,
                      color: '#f8fafc',
                      lineHeight: 1,
                    }}>
                      {billing === 'annual' ? price.perMonth : price.amount}
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.875rem' }}>/mo</span>
                  </div>
                  {billing === 'annual' && (
                    <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      Billed as {price.amount}/yr
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(tier.key)}
                  disabled={isLoading || checkoutLoading}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '0.875rem',
                    border: tier.recommended ? 'none' : `1px solid ${tier.color}40`,
                    background: tier.recommended ? tier.color : 'transparent',
                    color: tier.recommended ? '#020817' : tier.color,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: isLoading || checkoutLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading || checkoutLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                    marginBottom: '1.75rem',
                  }}
                  onMouseEnter={e => {
                    if (!tier.recommended) e.target.style.background = tier.color + '15';
                  }}
                  onMouseLeave={e => {
                    if (!tier.recommended) e.target.style.background = 'transparent';
                  }}
                >
                  {isLoading ? 'Redirecting…' : user ? 'Subscribe now' : 'Start free trial'}
                </button>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #1e293b', marginBottom: '1.5rem' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                      <span style={{ color: tier.color, fontSize: '1rem', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {tier.missing.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: '#334155' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.8rem', marginTop: '3rem' }}>
          All prices in GBP. Subscriptions renew automatically. Cancel anytime from your account.
        </p>
      </div>
    </div>
  );
}
