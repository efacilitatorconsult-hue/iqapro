import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Pricing from './Pricing';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const App = () => {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [centreName, setCentreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const isErrorMessage = (text) => {
    const value = String(text || '').toLowerCase();
    return value.includes('error') || value.includes('fill') || value.includes('invalid') || value.includes('failed');
  };

  const getSubscriptionExpiry = (metadata) => {
    const expires = metadata?.subscription_expires_at;
    if (!expires) return null;
    const date = new Date(expires);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isSubscriptionValid = (expiryDate) => {
    return expiryDate instanceof Date && expiryDate > new Date();
  };

  const formatDaysLeft = (expiryDate) => {
    if (!expiryDate) return 'expired';
    const diff = Math.max(0, expiryDate.getTime() - Date.now());
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days === 1 ? '1 day' : `${days} days`;
  };

  const removeQueryString = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const startCheckout = async (priceId) => {
    if (!priceId) {
      setMessage('No plan selected. Please choose a plan.');
      return;
    }
    setCheckoutLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, customerEmail: user.email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to create checkout session');
      }
      window.location.href = data.url;
    } catch (error) {
      setMessage(`Checkout failed: ${error.message}`);
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutSuccess = async (sessionId) => {
    if (!sessionId) { removeQueryString(); return; }
    if (!user) { removeQueryString(); return; }

    setCheckoutLoading(true);
    setMessage('Confirming subscription...');

    try {
      const response = await fetch(`/api/checkout-success?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to confirm subscription.');
      setUser((prevUser) => ({
        ...prevUser,
        subscription_expires_at: data.subscription_expires_at,
        subscription_valid: true
      }));
      setMessage('✅ Subscription activated successfully!');
      setShowPricing(false);
    } catch (error) {
      setMessage(`Subscription update failed: ${error.message}`);
    } finally {
      setCheckoutLoading(false);
      removeQueryString();
    }
  };

  const mapUser = (userData) => {
    const expiryDate = getSubscriptionExpiry(userData.user_metadata);
    return {
      id: userData.id,
      email: userData.email,
      centre_name: userData.user_metadata?.centre_name || 'My Centre',
      subscription_expires_at: expiryDate?.toISOString() || null,
      subscription_valid: isSubscriptionValid(expiryDate),
    };
  };

  useEffect(() => {
    let subscription = null;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) setUser(mapUser(session.user));

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      if (sessionId && session?.user) handleCheckoutSuccess(sessionId);

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) setUser(mapUser(session.user));
        else setUser(null);
      });
      subscription = listener?.subscription;
    };

    restoreSession();
    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async () => {
    if (!email || !password || !confirmPassword || !centreName) {
      setMessage('Please fill all fields'); return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match'); return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters'); return;
    }

    setLoading(true);
    setMessage('');

    const trialExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.auth.signUp(
      { email, password },
      { data: { centre_name: centreName, subscription_expires_at: trialExpiry } }
    );

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('✅ Success! Check your email to verify your account, then sign in.');
      setEmail(''); setPassword(''); setConfirmPassword(''); setCentreName('');
      setTimeout(() => setAuthMode('signin'), 4000);
    }
    setLoading(false);
  };

  const signIn = async () => {
    if (!email || !password) { setMessage('Please fill all fields'); return; }
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      const mapped = mapUser(data?.user);
      setUser(mapped);
      if (!mapped.subscription_valid) {
        setMessage('Your subscription has expired. Please renew to continue.');
      }
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthMode('signin');
    setEmail(''); setPassword(''); setConfirmPassword(''); setCentreName('');
    setMessage('');
    setShowPricing(false);
  };

  // ─── Not logged in ───────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-600 p-4 rounded-2xl mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">iqaPro</h1>
            <p className="text-slate-400">AI-powered IQA quality assurance</p>
            <div className="mt-3 inline-block bg-green-500 bg-opacity-20 border border-green-500 rounded-full px-4 py-1">
              <span className="text-green-300 text-sm font-semibold">✓ Connected to Database</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setAuthMode('signin'); setMessage(''); setConfirmPassword(''); }}
              className={`flex-1 py-2 rounded-2xl font-semibold transition ${authMode === 'signin' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setMessage(''); }}
              className={`flex-1 py-2 rounded-2xl font-semibold transition ${authMode === 'signup' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {authMode === 'signup' && (
              <input type="text" placeholder="Centre Name (e.g., ABC Training College)"
                value={centreName} onChange={(e) => setCentreName(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400" />
            )}
            <input type="email" placeholder="Email Address"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400" />
            <input type="password" placeholder="Password (min 6 characters)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400" />
            {authMode === 'signup' && (
              <input type="password" placeholder="Confirm Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-2xl text-white placeholder-slate-400" />
            )}
            <button onClick={authMode === 'signin' ? signIn : signUp} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50">
              {loading ? '⏳ Processing...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
            {message && (
              <div className={`p-3 rounded-2xl text-sm ${isErrorMessage(message) ? 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500' : 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700 text-slate-400 text-xs text-center">
            <p className="mb-2">30-day free trial. No credit card required to sign up.</p>
            <p>Saves IQAs 10+ hours/month on sampling plans and compliance.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Subscription expired ────────────────────────────────────────
  if (user && !user.subscription_valid) {
    if (showPricing) {
      return <Pricing user={user} onCheckout={startCheckout} checkoutLoading={checkoutLoading} onBack={() => setShowPricing(false)} />;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-pink-300 mb-4">Subscription expired</p>
          <h1 className="text-3xl font-bold text-white mb-4">Your iqapro access has ended</h1>
          <p className="text-slate-400 mb-6">
            Your trial or subscription expired on {user.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleDateString() : 'unknown'}.
          </p>
          <button onClick={() => setShowPricing(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition mb-3">
            View plans & renew
          </button>
          <button onClick={signOut}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800 transition">
            Sign out
          </button>
          {message && <div className="mt-4 text-sm text-slate-300">{message}</div>}
        </div>
      </div>
    );
  }

  // ─── Pricing page (active user choosing to upgrade/change plan) ──
  if (showPricing) {
    return <Pricing user={user} onCheckout={startCheckout} checkoutLoading={checkoutLoading} onBack={() => setShowPricing(false)} />;
  }

  // ─── Main dashboard ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-400">iqapro</p>
            <h1 className="text-4xl font-bold text-white">Welcome back, {user.centre_name}</h1>
            <p className="mt-2 text-slate-400">
              {user.subscription_expires_at
                ? `Subscription expires in ${formatDaysLeft(new Date(user.subscription_expires_at))}.`
                : 'Subscription status unavailable.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPricing(true)}
              className="rounded-2xl border border-sky-700 bg-sky-900 bg-opacity-40 px-5 py-3 text-sm font-semibold text-sky-300 hover:bg-opacity-70 transition">
              View Plans
            </button>
            <button onClick={signOut}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Sign Out
            </button>
          </div>
        </header>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm ${isErrorMessage(message) ? 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500' : 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500'}`}>
            {message}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-3">Quick actions</h2>
            <div className="space-y-3 text-slate-300">
              <p>• Review your latest IQA samples</p>
              <p>• Track centre compliance status</p>
              <p>• Manage auditors and schedules</p>
            </div>
          </div>
          <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Your status</p>
                <h3 className="text-2xl font-semibold text-white">Ready to sample</h3>
              </div>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">Active</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-800 p-4">
                <p className="text-3xl font-bold text-white">12</p>
                <p className="mt-2 text-slate-400 text-sm">Pending reviews</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-4">
                <p className="text-3xl font-bold text-white">4</p>
                <p className="mt-2 text-slate-400 text-sm">New reports</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-4">
                <p className="text-3xl font-bold text-white">97%</p>
                <p className="mt-2 text-slate-400 text-sm">Quality score</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
