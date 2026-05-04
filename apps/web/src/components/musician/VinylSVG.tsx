export function VinylSVG() {
  return (
    <svg className="w-[280px] h-[280px] animate-spin-slow" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vinylBase" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1a1a2e"/>
          <stop offset="30%"  stopColor="#0f0f1a"/>
          <stop offset="60%"  stopColor="#141420"/>
          <stop offset="100%" stopColor="#0a0a12"/>
        </radialGradient>
        <radialGradient id="vinylSheen" cx="35%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="rgba(108,99,255,0.18)"/>
          <stop offset="40%"  stopColor="rgba(224,64,251,0.06)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        <radialGradient id="labelGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#2a2060"/>
          <stop offset="60%"  stopColor="#1a1040"/>
          <stop offset="100%" stopColor="#110c30"/>
        </radialGradient>
        <radialGradient id="labelSheen" cx="40%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="rgba(108,99,255,0.4)"/>
          <stop offset="100%" stopColor="rgba(224,64,251,0)"/>
        </radialGradient>
        <linearGradient id="highlightLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.12)"/>
          <stop offset="50%"  stopColor="rgba(255,255,255,0.03)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <clipPath id="vinylClip">
          <circle cx="140" cy="140" r="134"/>
        </clipPath>
      </defs>

      <circle cx="140" cy="140" r="134" fill="url(#vinylBase)"/>

      <g clipPath="url(#vinylClip)" opacity="0.55">
        {[128,124,120,116,112,108,104,100,96,92,88,84,80,76,72,68,64,60].map((r, i) => (
          <circle key={r} cx="140" cy="140" r={r} fill="none"
            stroke={i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)'}
            strokeWidth={i % 2 === 0 ? '0.8' : '0.6'}/>
        ))}
        <circle cx="140" cy="140" r="118" fill="none" stroke="rgba(108,99,255,0.08)" strokeWidth="2"/>
        <circle cx="140" cy="140" r="98"  fill="none" stroke="rgba(224,64,251,0.07)" strokeWidth="2"/>
        <circle cx="140" cy="140" r="78"  fill="none" stroke="rgba(108,99,255,0.08)" strokeWidth="2"/>
      </g>

      <circle cx="140" cy="140" r="134" fill="url(#vinylSheen)"/>
      <ellipse cx="100" cy="90" rx="70" ry="30" fill="url(#highlightLine)" transform="rotate(-35 100 90)"/>

      <circle cx="140" cy="140" r="46" fill="url(#labelGrad)"/>
      <circle cx="140" cy="140" r="46" fill="url(#labelSheen)"/>
      <circle cx="140" cy="140" r="44" fill="none" stroke="rgba(108,99,255,0.3)" strokeWidth="1"/>

      <text x="140" y="132" textAnchor="middle" fontFamily="Space Grotesk, sans-serif"
        fontSize="7.5" fontWeight="700" letterSpacing="2.5" fill="rgba(255,255,255,0.75)">
        MAX SOUZA
      </text>
      <line x1="118" y1="137" x2="162" y2="137" stroke="rgba(108,99,255,0.4)" strokeWidth="0.8"/>
      <text x="140" y="147" textAnchor="middle" fontFamily="Space Grotesk, sans-serif"
        fontSize="5.5" letterSpacing="1.5" fill="rgba(255,255,255,0.4)">
        BATERISTA
      </text>

      <circle cx="140" cy="140" r="5" fill="#0a0a12"/>
      <circle cx="140" cy="140" r="5" fill="none" stroke="rgba(108,99,255,0.5)" strokeWidth="0.8"/>
      <circle cx="140" cy="140" r="134" fill="none" stroke="rgba(108,99,255,0.2)" strokeWidth="1.5"/>
    </svg>
  )
}
