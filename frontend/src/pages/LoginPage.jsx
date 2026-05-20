import React, { useState, useEffect } from 'react'

function LoginPage({ setUser, setUserType }) {
  const [hoveredSide, setHoveredSide] = useState(null)
  const [scanLine, setScanLine] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const handleGovClick = () => {
    window.location.href = '/gov-login'
  }

  const handleCitizenClick = () => {
    const user = { name: 'Citizen User', email: 'citizen@arnug.in' }
    localStorage.setItem('arnug_user', JSON.stringify(user))
    localStorage.setItem('arnug_type', 'citizen')
    setUser(user)
    setUserType('citizen')
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000A02',
      display: 'flex',
      fontFamily: 'Rajdhani, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* Scan Line Effect */}
      <div style={{
        position: 'absolute',
        top: scanLine + '%',
        left: 0, right: 0,
        height: '2px',
        background: 'rgba(46,204,64,0.15)',
        zIndex: 100,
        transition: 'top 0.05s linear',
        pointerEvents: 'none'
      }} />

      {/* Center Divider */}
      <div style={{
        position: 'absolute',
        left: '50%', top: 0, bottom: 0,
        width: '2px',
        background: 'linear-gradient(to bottom, transparent, #2ECC40, #2ECC40, transparent)',
        zIndex: 50,
        boxShadow: '0 0 20px rgba(46,204,64,0.8)'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px', height: '40px',
          background: '#000A02',
          border: '2px solid #2ECC40',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(46,204,64,0.8)',
          zIndex: 60
        }}>
          <div style={{
            width: '12px', height: '12px',
            background: '#2ECC40',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite'
          }} />
        </div>
      </div>

      {/* GOVERNMENT SIDE — LEFT */}
      <div
        onClick={handleGovClick}
        onMouseEnter={() => setHoveredSide('gov')}
        onMouseLeave={() => setHoveredSide(null)}
        style={{
          width: '50%', height: '100%',
          background: hoveredSide === 'gov'
            ? 'rgba(46,204,64,0.08)'
            : 'rgba(0,10,2,0.95)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.4s',
          borderRight: '1px solid rgba(46,204,64,0.2)'
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(46,204,64,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,204,64,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        {/* 3D Government Icon */}
        <div style={{
          width: '180px', height: '180px',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '30px'
        }}>
          {/* Rotating rings */}
          {[1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 120 + i * 30 + 'px',
              height: 120 + i * 30 + 'px',
              border: `1px solid rgba(46,204,64,${0.4 - i * 0.1})`,
              borderRadius: '50%',
              animation: `rotate${i % 2 === 0 ? 'Rev' : ''} ${3 + i}s linear infinite`
            }} />
          ))}
          {/* Shield Icon */}
          <div style={{
            width: '90px', height: '100px',
            background: 'linear-gradient(135deg, rgba(46,204,64,0.3), rgba(46,204,64,0.1))',
            border: '2px solid #2ECC40',
            borderRadius: '10px 10px 50% 50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(46,204,64,0.5)',
            zIndex: 10
          }}>
            <span style={{ fontSize: '40px' }}>⚖️</span>
          </div>
        </div>

        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '22px', fontWeight: '700',
          color: '#2ECC40', letterSpacing: '4px',
          textShadow: '0 0 20px rgba(46,204,64,0.8)',
          marginBottom: '12px'
        }}>GOVERNMENT</div>

        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '11px', color: 'rgba(46,204,64,0.6)',
          letterSpacing: '3px', textAlign: 'center',
          lineHeight: 1.8
        }}>
          AUTHORIZED PERSONNEL ONLY<br/>
          POLICE COMMISSIONER ACCESS
        </div>

        {hoveredSide === 'gov' && (
          <div style={{
            marginTop: '24px',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '11px', color: '#2ECC40',
            letterSpacing: '3px',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            [ CLICK ANYWHERE TO ENTER ]
          </div>
        )}

        {/* Corner decorations */}
        {[
          { top: 20, left: 20, borderWidth: '2px 0 0 2px' },
          { top: 20, right: 20, borderWidth: '2px 2px 0 0' },
          { bottom: 20, left: 20, borderWidth: '0 0 2px 2px' },
          { bottom: 20, right: 20, borderWidth: '0 2px 2px 0' }
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '30px', height: '30px',
            borderStyle: 'solid',
            borderColor: 'rgba(46,204,64,0.4)',
            ...style
          }} />
        ))}
      </div>

      {/* CITIZEN SIDE — RIGHT */}
      <div
        onClick={handleCitizenClick}
        onMouseEnter={() => setHoveredSide('citizen')}
        onMouseLeave={() => setHoveredSide(null)}
        style={{
          width: '50%', height: '100%',
          background: hoveredSide === 'citizen'
            ? 'rgba(255,153,0,0.05)'
            : 'rgba(0,10,2,0.95)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.4s'
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,153,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,153,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        {/* 3D Citizen Icon */}
        <div style={{
          width: '180px', height: '180px',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '30px'
        }}>
          {/* Rotating rings */}
          {[1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 120 + i * 30 + 'px',
              height: 120 + i * 30 + 'px',
              border: `1px solid rgba(255,153,0,${0.4 - i * 0.1})`,
              borderRadius: '50%',
              animation: `rotate${i % 2 === 0 ? '' : 'Rev'} ${3 + i}s linear infinite`
            }} />
          ))}
          {/* Ashoka Chakra style */}
          <div style={{
            width: '90px', height: '90px',
            background: 'linear-gradient(135deg, rgba(255,153,0,0.3), rgba(19,136,8,0.3))',
            border: '2px solid #FF9900',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255,153,0,0.5)',
            zIndex: 10
          }}>
            <span style={{ fontSize: '40px' }}>🇮🇳</span>
          </div>
        </div>

        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '22px', fontWeight: '700',
          color: '#FF9900', letterSpacing: '4px',
          textShadow: '0 0 20px rgba(255,153,0,0.8)',
          marginBottom: '12px'
        }}>CITIZEN</div>

        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '11px', color: 'rgba(255,153,0,0.6)',
          letterSpacing: '3px', textAlign: 'center',
          lineHeight: 1.8
        }}>
          PUBLIC ACCESS<br/>
          SIGN IN WITH GOOGLE
        </div>

        {hoveredSide === 'citizen' && (
          <div style={{
            marginTop: '24px',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '11px', color: '#FF9900',
            letterSpacing: '3px',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            [ CLICK ANYWHERE TO ENTER ]
          </div>
        )}

        {/* Corner decorations */}
        {[
          { top: 20, left: 20, borderWidth: '2px 0 0 2px' },
          { top: 20, right: 20, borderWidth: '2px 2px 0 0' },
          { bottom: 20, left: 20, borderWidth: '0 0 2px 2px' },
          { bottom: 20, right: 20, borderWidth: '0 2px 2px 0' }
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '30px', height: '30px',
            borderStyle: 'solid',
            borderColor: 'rgba(255,153,0,0.4)',
            ...style
          }} />
        ))}
      </div>

      {/* Top Title */}
      <div style={{
        position: 'absolute',
        top: '30px', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Orbitron, monospace',
        fontSize: '13px', fontWeight: '700',
        color: 'rgba(46,204,64,0.7)',
        letterSpacing: '5px',
        whiteSpace: 'nowrap'
      }}>
        ARNUG.IN — TRAFFIC ANALYSIS & MANAGEMENT SYSTEM
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.6); opacity: 0.4; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateRev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoginPage