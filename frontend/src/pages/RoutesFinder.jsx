import React, { useState, useEffect } from 'react'

function RoutesFinder() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState([])

  const colors = {
    bg: '#020A04', card: '#081408', green: '#2ECC40',
    amber: '#FFC107', red: '#FF3D00', cyan: '#00E5FF',
    text: '#C8E6C9', textDim: '#2E7D32',
    border: 'rgba(46,204,64,0.15)', borderBright: 'rgba(46,204,64,0.4)'
  }

  useEffect(() => {
    fetch('http://localhost:8000/api/areas')
      .then(r => r.json())
      .then(d => setAreas(d.areas))
      .catch(() => setAreas([
        'Whitefield', 'Marathahalli', 'Bellandur', 'Silk Board',
        'Electronic City', 'HSR Layout', 'Koramangala',
        'Outer Ring Road', 'Hebbal', 'Marathahalli IT'
      ]))
  }, [])

  const findRoutes = async () => {
    if (!origin || !destination) return
    if (origin === destination) {
      alert('Origin aur destination alag hone chahiye!')
      return
    }
    setLoading(true)
    setRoutes([])
    try {
      const res = await fetch('http://localhost:8000/api/routes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination })
      })
      const data = await res.json()
      setRoutes(data.routes || [])
    } catch (e) {
      console.log('Backend error:', e)
    }
    setLoading(false)
  }

  const selectStyle = {
    width: '100%', padding: '10px 14px',
    background: '#081408',
    border: `1px solid ${colors.borderBright}`,
    color: colors.green,
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: '13px', letterSpacing: '1px',
    outline: 'none', borderRadius: '2px',
    cursor: 'pointer'
  }

  return (
    <div>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px', color: colors.green,
        letterSpacing: '2px', marginBottom: '20px'
      }}>
        🛣️ AI ROUTE FINDER — A* ALGORITHM + TOMTOM LIVE TRAFFIC
      </div>

      {/* Route Input */}
      <div style={{
        background: colors.card,
        border: `1px solid ${colors.borderBright}`,
        padding: '20px', marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>

          {/* Origin */}
          <div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '10px', color: colors.textDim,
              letterSpacing: '2px', marginBottom: '8px'
            }}>📍 ORIGIN</div>
            <select value={origin} onChange={e => setOrigin(e.target.value)} style={selectStyle}>
              <option value="">-- Select Origin --</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Destination */}
          <div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '10px', color: colors.textDim,
              letterSpacing: '2px', marginBottom: '8px'
            }}>🎯 DESTINATION</div>
            <select value={destination} onChange={e => setDestination(e.target.value)} style={selectStyle}>
              <option value="">-- Select Destination --</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Find Button */}
          <button onClick={findRoutes} disabled={loading || !origin || !destination} style={{
            padding: '10px 24px',
            background: loading ? 'rgba(46,204,64,0.1)' : 'rgba(46,204,64,0.2)',
            border: `1px solid ${colors.green}`,
            color: colors.green,
            fontFamily: 'Orbitron, monospace',
            fontSize: '12px', fontWeight: '700',
            letterSpacing: '2px', cursor: loading ? 'wait' : 'pointer',
            borderRadius: '2px', whiteSpace: 'nowrap'
          }}>
            {loading ? 'COMPUTING...' : 'FIND ROUTE'}
          </button>
        </div>

        {/* Current Time Info */}
        <div style={{
          marginTop: '12px',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '9px', color: colors.textDim,
          letterSpacing: '1px'
        }}>
          ⏰ Current Time: {new Date().toLocaleTimeString()} &nbsp;|&nbsp;
          🤖 Algorithm: A* + Dynamic Load Balancing &nbsp;|&nbsp;
          📡 Traffic: TomTom Live
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px', gap: '12px'
        }}>
          <div style={{
            width: '12px', height: '12px',
            background: colors.green, borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '12px', color: colors.green, letterSpacing: '2px'
          }}>CALCULATING OPTIMAL ROUTES...</div>
        </div>
      )}

      {/* Routes Result */}
      {routes.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: colors.green,
            letterSpacing: '2px', marginBottom: '16px'
          }}>
            ✅ {routes.length} ROUTES FOUND: {origin} → {destination}
          </div>

          {routes.map((route, i) => (
            <div key={i} style={{
              background: colors.card,
              border: `1px solid ${i === 0 ? colors.green : colors.border}`,
              borderLeft: `4px solid ${i === 0 ? colors.green : i === 1 ? colors.amber : colors.cyan}`,
              padding: '20px', marginBottom: '16px',
              position: 'relative'
            }}>
              {/* Best Route Badge */}
              {i === 0 && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: '9px', padding: '3px 10px',
                  background: 'rgba(46,204,64,0.2)',
                  border: `1px solid ${colors.green}`,
                  color: colors.green, borderRadius: '2px',
                  letterSpacing: '1px'
                }}>⭐ RECOMMENDED</div>
              )}

              {/* Route Name */}
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '14px', fontWeight: '700',
                color: i === 0 ? colors.green : i === 1 ? colors.amber : colors.cyan,
                marginBottom: '12px'
              }}>#{i+1} {route.name}</div>

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px', marginBottom: '16px'
              }}>
                {[
                  { label: 'DISTANCE', value: route.distance, icon: '📏' },
                  { label: 'EST. TIME', value: route.time, icon: '⏱️' },
                  { label: 'TRAFFIC SOURCE', value: route.source, icon: '📡' },
                ].map((stat, j) => (
                  <div key={j} style={{
                    background: 'rgba(46,204,64,0.03)',
                    border: `1px solid ${colors.border}`,
                    padding: '12px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                    <div style={{
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: '8px', color: colors.textDim,
                      letterSpacing: '1px', marginBottom: '4px'
                    }}>{stat.label}</div>
                    <div style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '13px', fontWeight: '700',
                      color: i === 0 ? colors.green : i === 1 ? colors.amber : colors.cyan
                    }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Path */}
              <div style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '10px', color: colors.textDim,
                letterSpacing: '1px', marginBottom: '8px'
              }}>🗺️ ROUTE PATH:</div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center'
              }}>
                {route.via.split(' → ').map((stop, k, arr) => (
                  <React.Fragment key={k}>
                    <div style={{
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: '11px', padding: '4px 10px',
                      background: k === 0 || k === arr.length-1
                        ? 'rgba(46,204,64,0.15)' : 'rgba(46,204,64,0.05)',
                      border: `1px solid ${k === 0 || k === arr.length-1 ? colors.green : colors.border}`,
                      color: k === 0 || k === arr.length-1 ? colors.green : colors.text,
                      borderRadius: '2px'
                    }}>{stop}</div>
                    {k < arr.length-1 && (
                      <div style={{ color: colors.textDim, fontSize: '12px' }}>→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {route.note && (
                <div style={{
                  marginTop: '12px',
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: '10px', color: colors.cyan,
                  padding: '8px 12px',
                  background: 'rgba(0,229,255,0.05)',
                  border: `1px solid rgba(0,229,255,0.2)`,
                  borderRadius: '2px'
                }}>💡 {route.note}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No routes */}
      {!loading && routes.length === 0 && origin && destination && (
        <div style={{
          textAlign: 'center', padding: '40px',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '12px', color: colors.textDim
        }}>
          No direct route found between selected areas.
        </div>
      )}
    </div>
  )
}

export default RoutesFinder