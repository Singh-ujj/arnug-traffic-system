import React, { useEffect, useState } from 'react'

function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState(1)
  const [wink, setWink] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 2000)
    const t2 = setTimeout(() => setPhase(3), 4000)
    const t3 = setTimeout(() => setWink(true), 5500)
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
      {[...Array(100)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 3 + 1 + 'px',
          height: Math.random() * 3 + 1 + 'px',
          background: 'white', borderRadius: '50%',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          opacity: Math.random(),
          animation: `twinkle ${Math.random() * 3 + 1}s infinite alternate`
        }} />
      ))}

      {/* Earth */}
      <div style={{
        position: 'absolute',
        width: phase === 1 ? '300px' : phase === 2 ? '200px' : '80px',
        height: phase === 1 ? '300px' : phase === 2 ? '200px' : '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #4CAF50, #1565C0, #0D47A1)',
        boxShadow: '0 0 40px rgba(76,175,80,0.5), inset -20px -10px 40px rgba(0,0,0,0.5)',
        transition: 'all 2s ease-in-out',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <div style={{
          position: 'absolute', width: '60px', height: '40px',
          background: 'rgba(76,175,80,0.8)', borderRadius: '50%',
          top: '30%', left: '20%'
        }} />
        <div style={{
          position: 'absolute', width: '40px', height: '60px',
          background: 'rgba(76,175,80,0.8)', borderRadius: '50%',
          top: '20%', left: '55%'
        }} />
      </div>

      {/* Rocket + Cartoon */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${phase === 1 ? 0.3 : phase === 2 ? 0.7 : 1.4})`,
        transition: 'all 2s ease-in-out',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 10
      }}>

        {/* Cartoon HEAD popping out of rocket */}
        <div style={{ position: 'relative', display: 'inline-block', textAlign: 'center' }}>

          {/* HEAD */}
          <div style={{
            width: '80px', height: '80px',
            background: 'radial-gradient(circle, #FFD700, #FFA000)',
            borderRadius: '50%',
            border: '3px solid #FF8F00',
            boxShadow: '0 0 20px rgba(255,215,0,0.6)',
            position: 'relative',
            zIndex: 2,
            marginBottom: '-20px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {/* Left Ear */}
            <div style={{
              position: 'absolute', top: '10%', left: '-14%',
              width: '24px', height: '34px',
              background: '#FFD700', borderRadius: '50%',
              border: '3px solid #FF8F00'
            }} />
            {/* Right Ear */}
            <div style={{
              position: 'absolute', top: '10%', right: '-14%',
              width: '24px', height: '34px',
              background: '#FFD700', borderRadius: '50%',
              border: '3px solid #FF8F00'
            }} />
            {/* Left Eye — wink karta hai */}
            <div style={{
              position: 'absolute', top: '32%', left: '18%',
              width: '16px',
              height: wink ? '3px' : '16px',
              background: '#1A1A1A',
              borderRadius: wink ? '2px' : '50%',
              transition: 'height 0.3s'
            }} />
            {/* Right Eye */}
            <div style={{
              position: 'absolute', top: '32%', right: '18%',
              width: '16px', height: '16px',
              background: '#1A1A1A', borderRadius: '50%'
            }} />
            {/* Nose */}
            <div style={{
              position: 'absolute', top: '52%', left: '50%',
              transform: 'translateX(-50%)',
              width: '8px', height: '6px',
              background: '#FF6F00', borderRadius: '50%'
            }} />
            {/* Smile */}
            <div style={{
              position: 'absolute', bottom: '18%', left: '20%',
              width: '60%', height: '16px',
              borderBottom: '3px solid #1A1A1A',
              borderRadius: '0 0 30px 30px'
            }} />
          </div>

          {/* ROCKET — head ke bilkul neeche */}
          <div style={{
            fontSize: '90px',
            lineHeight: 1,
            filter: 'drop-shadow(0 0 15px rgba(255,100,0,0.8))',
            animation: 'rocketFloat 2s ease-in-out infinite alternate'
          }}>🚀</div>

          {/* Rocket flame */}
          {phase === 3 && (
            <div style={{
              fontSize: '40px',
              marginTop: '-20px',
              animation: 'flameFlicker 0.3s infinite alternate'
            }}>🔥</div>
          )}
        </div>
      </div>

      {/* ARNUG Text */}
      {phase === 3 && (
        <div style={{
          position: 'absolute', bottom: '15%',
          fontFamily: 'Orbitron, monospace',
          fontSize: '28px', fontWeight: '900',
          color: '#2ECC40', letterSpacing: '8px',
          textShadow: '0 0 20px rgba(46,204,64,0.8)',
          animation: 'fadeIn 1s ease-in'
        }}>
          ARNUG.IN
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.2; }
          to { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rocketFloat {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
        @keyframes flameFlicker {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

export default IntroAnimation