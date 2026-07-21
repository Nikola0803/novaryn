import { Link } from 'react-router-dom';
import { THEMES, NETWORK_NAME } from '../themes';

/**
 * Bare-domain landing page — only reached if someone visits the portal
 * without a storefront-specific link (normally affiliates arrive via
 * "Affiliate Login" on their own storefront's site, which links straight to
 * /<storefront>/login or /register, skipping this page entirely).
 *
 * Kept intentionally minimal: this used to be a full recruiting microsite
 * (hero/why-partners/how-it-works/terms/compliance) ported from the client
 * mockup, but that added clicks in front of the two things anyone landing
 * here actually wants — Apply, or Sign In. Both now go straight to the real
 * form for the house they pick, no intermediate marketing page.
 */
export default function Home() {
  const houses = Object.values(THEMES);
  const singleHouse = houses.length === 1 ? houses[0] : null;

  return (
    <div className="calibrate-landing min-h-screen flex items-center justify-center py-10 px-4">
      <div className="page w-full max-w-lg p-8 md:p-10">
        <div className="text-center mb-8">
          <span className="eyebrow">{NETWORK_NAME}</span>
          <h1 style={{ marginTop: 10, fontSize: '1.5rem' }}>
            {singleHouse ? `${singleHouse.name} Affiliates` : 'Choose your house'}
          </h1>
          <p style={{ marginTop: 10, fontSize: '0.9rem', color: 'rgba(233,237,242,0.55)' }}>
            {singleHouse
              ? 'Sign in to your dashboard, or apply to join the program.'
              : 'Each house has its own affiliate account — pick the one you want to apply to or sign in to.'}
          </p>
        </div>

        {singleHouse ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to={`/${singleHouse.id}/login`} className="cta ghost" style={{ padding: '10px 22px', fontSize: '0.8rem' }}>
              Sign In
            </Link>
            <Link to={`/${singleHouse.id}/register`} className="cta" style={{ padding: '10px 22px', fontSize: '0.8rem' }}>
              Apply
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {houses.map((h) => (
              <div key={h.id} className="house-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="hb-name">{h.name}</div>
                  <div className="hb-sub">{h.siteUrl ? 'Live now' : 'Launching soon'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link to={`/${h.id}/login`} className="cta ghost" style={{ padding: '8px 16px', fontSize: '0.72rem' }}>
                    Sign In
                  </Link>
                  <Link to={`/${h.id}/register`} className="cta" style={{ padding: '8px 16px', fontSize: '0.72rem' }}>
                    Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
