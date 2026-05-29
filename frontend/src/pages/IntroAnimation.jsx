import React, { useEffect, useState } from 'react'

function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 2000)
    const t2 = setTimeout(() => setPhase(3), 4000)
    const t3 = setTimeout(() => setPhase(4), 5500)
    const t4 = setTimeout(() => onComplete(), 7000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000510',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative'
    }}>

      {/* Stars */}
      {[...Array(120)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 2 + 1 + 'px',
          height: Math.random() * 2 + 1 + 'px',
          background: 'white', borderRadius: '50%',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          opacity: Math.random() * 0.8 + 0.2,
          animation: `twinkle ${Math.random() * 3 + 1}s infinite alternate`
        }} />
      ))}

      {/* Grid Lines — satellite scan effect */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(46,204,64,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(46,204,64,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridScroll 20s linear infinite'
      }} />

      {/* Scan Line */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(46,204,64,0.8), transparent)',
        animation: 'scanLine 3s linear infinite',
        zIndex: 5
      }} />

      {/* Earth — Phase 1 & 2 */}
      <div style={{
        position: 'absolute',
        width: phase <= 2 ? '320px' : '60px',
        height: phase <= 2 ? '320px' : '60px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #1a6b3a, #1565C0, #0D47A1)',
        boxShadow: '0 0 60px rgba(21,101,192,0.6), inset -20px -10px 40px rgba(0,0,0,0.6)',
        transition: 'all 2s ease-in-out',
        left: phase <= 2 ? '50%' : '85%',
        top: phase <= 2 ? '50%' : '15%',
        transform: phase <= 2 ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)',
        zIndex: 2
      }}>
        {/* Continents */}
        <div style={{ position: 'absolute', width: '80px', height: '50px', background: 'rgba(46,160,64,0.7)', borderRadius: '40% 60% 50% 60%', top: '25%', left: '15%' }} />
        <div style={{ position: 'absolute', width: '50px', height: '70px', background: 'rgba(46,160,64,0.7)', borderRadius: '50% 40% 60% 40%', top: '20%', left: '55%' }} />
        <div style={{ position: 'absolute', width: '60px', height: '40px', background: 'rgba(46,160,64,0.6)', borderRadius: '50%', top: '55%', left: '35%' }} />
        {/* Atmosphere glow */}
        <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '8px solid rgba(100,180,255,0.15)', boxShadow: '0 0 30px rgba(100,180,255,0.2)' }} />
        {/* Bangalore marker */}
        {phase === 2 && (
          <div style={{
            position: 'absolute', top: '38%', left: '58%',
            width: '8px', height: '8px',
            background: '#FF3D00', borderRadius: '50%',
            boxShadow: '0 0 12px rgba(255,61,0,0.9)',
            animation: 'ping 1s infinite'
          }} />
        )}
      </div>

      {/* Satellite orbit ring */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute',
          width: phase === 2 ? '420px' : '80px',
          height: phase === 2 ? '420px' : '80px',
          borderRadius: '50%',
          border: '1px dashed rgba(46,204,64,0.3)',
          left: phase === 2 ? '50%' : '85%',
          top: phase === 2 ? '50%' : '15%',
          transform: 'translate(-50%, -50%)',
          transition: 'all 2s ease-in-out',
          zIndex: 3,
          animation: 'orbitSpin 8s linear infinite'
        }}>
          {/* Satellite */}
          <div style={{
            position: 'absolute', top: '-12px', left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '22px',
            filter: 'drop-shadow(0 0 8px rgba(46,204,64,0.8))'
          }}>🛰️</div>
        </div>
      )}

      {/* Center Content — Phase 3 & 4 */}
      {phase >= 3 && (
        <div style={{
          position: 'absolute',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '16px',
          animation: 'fadeInUp 1s ease-out',
          zIndex: 10
        }}>
          {/* Logo */}
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '52px', fontWeight: '900',
            color: '#2ECC40',
            letterSpacing: '12px',
            textShadow: '0 0 30px rgba(46,204,64,0.8), 0 0 60px rgba(46,204,64,0.4)',
            animation: 'glowPulse 2s infinite alternate'
          }}>ARNUG</div>

          {/* Tagline */}
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '13px',
            color: 'rgba(46,204,64,0.7)',
            letterSpacing: '6px',
            textAlign: 'center'
          }}>AI TRAFFIC ANALYSIS & MANAGEMENT</div>

          {/* Divider */}
          <div style={{
            width: '300px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #2ECC40, transparent)',
            margin: '8px 0'
          }} />

          {/* Stats row */}
          {phase === 4 && (
            <div style={{
              display: 'flex', gap: '32px',
              animation: 'fadeInUp 0.8s ease-out'
            }}>
              {[
                { value: '10', label: 'ZONES' },
                { value: 'A*', label: 'ALGORITHM' },
                { value: 'LIVE', label: 'TOMTOM' },
                { value: 'FCN', label: 'AI MODEL' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '20px', fontWeight: '700',
                    color: '#2ECC40',
                    textShadow: '0 0 10px rgba(46,204,64,0.6)'
                  }}>{item.value}</div>
                  <div style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: '9px', color: 'rgba(46,204,64,0.5)',
                    letterSpacing: '2px', marginTop: '4px'
                  }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Loading bar */}
          <div style={{
            width: '300px', height: '2px',
            background: 'rgba(46,204,64,0.15)',
            borderRadius: '2px', marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #2ECC40, #00E5FF)',
              borderRadius: '2px',
              animation: 'loadBar 1.5s ease-out forwards'
            }} />
          </div>

          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: 'rgba(46,204,64,0.5)',
            letterSpacing: '3px'
          }}>INITIALIZING SYSTEM...</div>
        </div>
      )}

      {/* Corner HUD elements */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(46,204,64,0.4)', letterSpacing: '2px' }}>
        SYS://ARNUG.IN<br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>LAT: 12.9716° N</span><br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>LNG: 77.5946° E</span>
      </div>
      <div style={{ position: 'absolute', top: '20px', right: '20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(46,204,64,0.4)', letterSpacing: '2px', textAlign: 'right' }}>
        BANGALORE, IN<br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>STATUS: ACTIVE</span><br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>SATELLITE: ONLINE</span>
      </div>
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(46,204,64,0.4)', letterSpacing: '2px' }}>
        RV COLLEGE OF ENGINEERING<br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>M.TECH CNE — 2025-26</span>
      </div>
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(46,204,64,0.4)', letterSpacing: '2px', textAlign: 'right' }}>
        UJJWAL KUMAR<br/>
        <span style={{ color: 'rgba(46,204,64,0.25)' }}>1RV24SCN15</span>
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.2; }
          to { opacity: 1; }
        }
        @keyframes scanLine {
          from { top: 0; }
          to { top: 100%; }
        }
        @keyframes gridScroll {
          from { backgroundPosition: 0 0; }
          to { backgroundPosition: 50px 50px; }
        }
        @keyframes orbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ping {
          0% { box-shadow: 0 0 0 0 rgba(255,61,0,0.8); }
          100% { box-shadow: 0 0 0 12px rgba(255,61,0,0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          from { text-shadow: 0 0 20px rgba(46,204,64,0.6); }
          to { text-shadow: 0 0 40px rgba(46,204,64,1), 0 0 80px rgba(46,204,64,0.4); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default IntroAnimation