import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';

export const NewsletterSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Simple, standard RFC-compliant email regex
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  const isEmailValid = validateEmail(email);
  const showError = touched && email.length > 0 && !isEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus('error');
      setFeedbackMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus('error');
      setFeedbackMessage('Please enter a valid email address (e.g., yourname@domain.com).');
      return;
    }

    setStatus('loading');
    setFeedbackMessage('');

    try {
      const response = await subscribeNewsletter(trimmedEmail);
      setStatus('success');
      setFeedbackMessage(response.message || 'Thank you for subscribing! Check your inbox soon for private updates.');
      setEmail('');
      setTouched(false);
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(err.message || 'Unable to subscribe at this moment. Please try again.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setFeedbackMessage('');
    setEmail('');
    setTouched(false);
  };

  return (
    <section
      aria-label="Newsletter Subscription"
      className="bg-gradient-to-b from-[#FAF7F5] to-[#F5EFEA] border-t border-[#EFE8E5] py-14 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Decorative ambient background accent */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#EED0C9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#552743]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
        {/* Header kicker & headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#886A72]">
            <Mail size={14} className="text-[#886A72]" />
            <span>The Aura Insider</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-luxury font-medium text-[#2B1220] tracking-tight">
            Stay in Touch with Curated Collections
          </h2>
          <p className="text-xs sm:text-sm text-[#6E5D65] max-w-xl mx-auto leading-relaxed">
            Receive private notifications for new luxury bra and panty arrivals, seasonal flash sales, and tailored sizing recommendations. Zero clutter, strictly confidential.
          </p>
        </div>

        {/* Subscription Form or Success Card */}
        {status === 'success' ? (
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#2B1220]">You're on the Guestlist!</h3>
              <p className="text-xs text-[#55464D] leading-relaxed">
                {feedbackMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#886A72] hover:text-[#2B1220] underline transition-colors pt-2 cursor-pointer"
            >
              Subscribe with another email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-md mx-auto space-y-3 text-left"
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#886A72]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  onBlur={() => setTouched(true)}
                  placeholder="Enter your email (e.g. name@example.com)"
                  aria-label="Email address for newsletter"
                  aria-invalid={showError || status === 'error'}
                  aria-describedby="email-validation-feedback"
                  disabled={status === 'loading'}
                  className={`w-full pl-10 pr-4 py-3 bg-white text-xs sm:text-sm text-[#2B1220] placeholder:text-[#9B7E84] rounded-xl border transition-all outline-none shadow-xs ${
                    showError || status === 'error'
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                      : 'border-[#DED4CE] focus:border-[#2B1220] focus:ring-2 focus:ring-[#2B1220]/10'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="py-3 px-6 bg-[#2B1220] hover:bg-[#3D1E2F] active:bg-[#1D0C16] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            {/* Validation & Server Error Messages */}
            {showError && (
              <div
                id="email-validation-feedback"
                className="flex items-center gap-1.5 text-xs text-rose-700 pl-1"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>Please enter a valid email format (e.g., name@example.com).</span>
              </div>
            )}

            {status === 'error' && feedbackMessage && !showError && (
              <div
                id="email-validation-feedback"
                className="flex items-center gap-1.5 text-xs text-rose-700 pl-1"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Privacy note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#886A72] pt-1">
              <ShieldCheck size={13} className="text-[#886A72]" />
              <span>We never share your email. 100% confidential. Unsubscribe anytime.</span>
            </div>
          </form>
        )}

        {/* Benefits bar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center border-t border-[#EFE8E5]/70 max-w-xl mx-auto">
          <div className="text-[11px] text-[#6E5D65]">
            <span className="font-semibold text-[#2B1220]">New Drops:</span> First access to limited palettes
          </div>
          <div className="text-[11px] text-[#6E5D65]">
            <span className="font-semibold text-[#2B1220]">Private Sales:</span> Secret holiday discount links
          </div>
          <div className="text-[11px] text-[#6E5D65]">
            <span className="font-semibold text-[#2B1220]">Fit Journal:</span> Honest lingerie sizing guidance
          </div>
        </div>
      </div>
    </section>
  );
};
