import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

function CitizenDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('home')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [liveAlerts, setLiveAlerts] = useState([])
  const [routes, setRoutes] = useState([])
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [areas, setAreas] = useState([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [reportForm, setReportForm] = useState({ type: 'accident', area: '', description: '' })
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchAlerts()
    fetchAreas()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts/live')
      const data = await res.json()
      if (data.alerts) setLiveAlerts(data.alerts)
    } catch (e) {}
  }

  const fetchAreas = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/areas')
      const data = await res.json()
      if (data.areas) setAreas(data.areas)
    } catch (e) {
      setAreas(['Whitefield', 'Marathahalli', 'Bellandur', 'Silk Board', 'Electronic City', 'HSR Layout', 'Koramangala', 'Outer Ring Road', 'Hebbal', 'Marathahalli IT'])
    }
  }

  const findRoute = async () => {
    if (!origin || !destination) return
    setLoadingRoute(true)
    setRoutes([])
    try {
      const res = await fetch('http://localhost:8000/api/routes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination })
      })
      const data = await res.json()
      if (data.routes) setRoutes(data.routes)
    } catch (e) {}
    setLoadingRoute(false)
  }

  const submitReport = async () => {
    if (!reportForm.area || !reportForm.description) return
    try {
      await supabase.from('reports').insert([{
        type: reportForm.type,
        area: reportForm.area,
        description: reportForm.description,
        status: 'open'
      }])
      setReportSent(true)
      setReportForm({ type: 'accident', area: '', description: '' })
      setTimeout(() => setReportSent(false), 3000)
    } catch (e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem('arnug_user')
    localStorage.removeItem('arnug_type')
    setUser(null)
  }

  const colors = {
    bg: '#020A04', panel: '#06100A', card: '#081408',
    saffron: '#FF9933', green: '#138808', white: '#F5F5F5',
    amber: '#FFC107', red: '#FF3D00', cyan: '#00E5FF',
    text: '#E8F5E9', textDim: '#558B2F',
    border: 'rgba(255,153,51,0.2)', borderGreen: 'rgba(19,136,8,0.3)'
  }

  const tabs = [
    { id: 'home', label: 'HOME', icon: '🏠' },
    { id: 'alerts', label: 'ALERTS', icon: '🔔' },
    { id: 'routes', label: 'MY ROUTES', icon: '🛣️' },
    { id: 'report', label: 'REPORT', icon: '📢' },
    { id: 'parking', label: 'PARKING', icon: '🅿️' },
    { id: 'sos', label: 'SOS', icon: '🆘' },
  ]

  const selectStyle = {
    width: '100%', padding: '10px 14px',
    background: '#081408',
    border: `1px solid ${colors.saffron}`,
    color: colors.saffron,
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: '13px', outline: 'none',
    borderRadius: '2px', cursor: 'pointer'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: colors.bg, fontFamily: 'Rajdhani, sans-serif', color: colors.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* TOP BAR — Tiranga Style */}
      <div style={{ height: '56px', background: `linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: '900', color: colors.saffron, letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          🇮🇳 ARNUG — CITIZEN
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.white, letterSpacing: '2px', textAlign: 'center', zIndex: 1 }}>
          JAI HIND — SMART TRAFFIC SYSTEM<br/>
          <span style={{ color: colors.saffron }}>{currentTime.toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', zIndex: 1 }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.white, padding: '3px 10px', border: '1px solid rgba(255,153,51,0.5)', borderRadius: '2px' }}>
            👤 {user?.name || 'CITIZEN'}
          </div>
          <button onClick={handleLogout} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', padding: '4px 12px', background: 'rgba(255,61,0,0.2)', border: '1px solid #FF3D00', color: '#FF3D00', cursor: 'pointer', borderRadius: '2px' }}>LOGOUT</button>
        </div>
      </div>

      {/* Tiranga Strip */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)', flexShrink: 0 }} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '180px', background: colors.panel, borderRight: `1px solid ${colors.borderGreen}`, display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === tab.id ? (tab.id === 'sos' ? 'rgba(255,61,0,0.15)' : 'rgba(255,153,51,0.1)') : 'transparent', borderLeft: activeTab === tab.id ? `3px solid ${tab.id === 'sos' ? colors.red : colors.saffron}` : '3px solid transparent', color: activeTab === tab.id ? (tab.id === 'sos' ? colors.red : colors.saffron) : colors.textDim, fontSize: '13px', fontWeight: '600', letterSpacing: '1px', transition: 'all 0.2s' }}>
              <span>{tab.icon}</span>{tab.label}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div>
              {/* Welcome */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${colors.saffron}`, padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', color: colors.saffron, letterSpacing: '2px' }}>
                  NAMASTE, {user?.name?.toUpperCase() || 'CITIZEN'} 🙏
                </div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '4px' }}>
                  BANGALORE TRAFFIC INTELLIGENCE SYSTEM — {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'ACTIVE ALERTS', value: liveAlerts.length, sub: 'Live TomTom data', color: liveAlerts.length > 3 ? colors.red : colors.amber },
                  { label: 'CRITICAL ZONES', value: liveAlerts.filter(a => a.type === 'critical').length, sub: 'Avoid these areas', color: colors.red },
                  { label: 'SYSTEM STATUS', value: 'LIVE', sub: 'All systems active', color: colors.green },
                ].map((stat, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${stat.color}`, padding: '14px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: colors.textDim, marginTop: '4px' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Live Alerts Preview */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.saffron, letterSpacing: '2px', marginBottom: '12px' }}>🔔 LIVE TRAFFIC ALERTS</div>
                {liveAlerts.length === 0 ? (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '20px' }}>✅ No active alerts — Traffic is normal!</div>
                ) : (
                  liveAlerts.slice(0, 3).map((alert, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 12px', marginBottom: '8px', borderLeft: `2px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, background: 'rgba(255,153,51,0.03)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{alert.message}</div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginTop: '2px' }}>📍 {alert.area} • {alert.current_speed} km/h</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.saffron, letterSpacing: '2px', marginBottom: '16px' }}>
                🔔 ALL LIVE ALERTS — TOMTOM REAL-TIME
                <span style={{ marginLeft: '12px', fontSize: '9px', padding: '2px 8px', background: 'rgba(255,153,51,0.1)', border: `1px solid ${colors.saffron}`, borderRadius: '2px' }}>AUTO REFRESH 30s</span>
              </div>
              {liveAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: colors.textDim }}>✅ NO ACTIVE ALERTS — TRAFFIC NORMAL</div>
              ) : (
                liveAlerts.map((alert, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, borderLeft: `4px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, padding: '16px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: '700', color: alert.type === 'critical' ? colors.red : colors.amber }}>{alert.area}</div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', background: alert.type === 'critical' ? 'rgba(255,61,0,0.1)' : 'rgba(255,193,7,0.1)', border: `1px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, color: alert.type === 'critical' ? colors.red : colors.amber, borderRadius: '2px' }}>{alert.type?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>{alert.message}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim }}>
                      🚗 Speed: {alert.current_speed} km/h &nbsp;|&nbsp; 📊 Congestion: {alert.congestion_score}%
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.saffron, letterSpacing: '2px', marginBottom: '16px' }}>🛣️ AI ROUTE FINDER — A* + TOMTOM LIVE</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>📍 FROM</div>
                    <select value={origin} onChange={e => setOrigin(e.target.value)} style={selectStyle}>
                      <option value="">-- Select --</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>🎯 TO</div>
                    <select value={destination} onChange={e => setDestination(e.target.value)} style={selectStyle}>
                      <option value="">-- Select --</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <button onClick={findRoute} disabled={loadingRoute || !origin || !destination} style={{ padding: '10px 20px', background: 'rgba(255,153,51,0.2)', border: `1px solid ${colors.saffron}`, color: colors.saffron, fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', cursor: 'pointer', borderRadius: '2px' }}>
                    {loadingRoute ? 'FINDING...' : 'FIND'}
                  </button>
                </div>
              </div>

              {routes.map((route, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${i === 0 ? colors.saffron : colors.border}`, borderLeft: `4px solid ${i === 0 ? colors.saffron : i === 1 ? colors.amber : colors.green}`, padding: '16px', marginBottom: '12px' }}>
                  {i === 0 && <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.saffron, marginBottom: '8px' }}>⭐ RECOMMENDED</div>}
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', color: i === 0 ? colors.saffron : i === 1 ? colors.amber : colors.green, marginBottom: '10px' }}>#{i+1} {route.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { label: 'DISTANCE', value: route.distance },
                      { label: 'TIME', value: route.time },
                      { label: 'SOURCE', value: route.source },
                    ].map((s, j) => (
                      <div key={j} style={{ textAlign: 'center', background: 'rgba(255,153,51,0.03)', border: `1px solid ${colors.border}`, padding: '8px' }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: '700', color: colors.saffron }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim }}>
                    🗺️ {route.via}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REPORT TAB */}
          {activeTab === 'report' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.saffron, letterSpacing: '2px', marginBottom: '16px' }}>📢 REPORT TRAFFIC ISSUE</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '24px' }}>
                {reportSent && (
                  <div style={{ background: 'rgba(19,136,8,0.1)', border: '1px solid #138808', color: '#138808', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                    ✅ REPORT SUBMITTED SUCCESSFULLY!
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>ISSUE TYPE</div>
                  <select value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value})} style={selectStyle}>
                    <option value="accident">🚗 Accident</option>
                    <option value="roadblock">🚧 Road Block</option>
                    <option value="waterlogging">🌊 Waterlogging</option>
                    <option value="signal">🚦 Signal Issue</option>
                    <option value="other">⚠️ Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>AREA</div>
                  <select value={reportForm.area} onChange={e => setReportForm({...reportForm, area: e.target.value})} style={selectStyle}>
                    <option value="">-- Select Area --</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>DESCRIPTION</div>
                  <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} placeholder="Describe the issue..." rows={4} style={{ width: '100%', padding: '10px 14px', background: '#081408', border: `1px solid ${colors.saffron}`, color: colors.text, fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', outline: 'none', borderRadius: '2px', resize: 'vertical' }} />
                </div>
                <button onClick={submitReport} style={{ width: '100%', padding: '12px', background: 'rgba(255,153,51,0.2)', border: `1px solid ${colors.saffron}`, color: colors.saffron, fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', cursor: 'pointer', borderRadius: '2px' }}>
                  SUBMIT REPORT
                </button>
              </div>
            </div>
          )}

          {/* PARKING TAB */}
          {activeTab === 'parking' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.saffron, letterSpacing: '2px', marginBottom: '16px' }}>🅿️ NEARBY PARKING — BANGALORE IT HUB</div>
              {[
                { name: 'Whitefield Forum Mall Parking', area: 'Whitefield', slots: 450, available: 123, rate: '₹40/hr' },
                { name: 'Marathahalli Signal Parking', area: 'Marathahalli', slots: 200, available: 45, rate: '₹30/hr' },
                { name: 'Silk Board Parking Complex', area: 'Silk Board', slots: 300, available: 0, rate: '₹20/hr' },
                { name: 'Electronic City Phase 1', area: 'Electronic City', slots: 600, available: 234, rate: '₹25/hr' },
                { name: 'HSR Layout BDA Complex', area: 'HSR Layout', slots: 150, available: 67, rate: '₹20/hr' },
              ].map((park, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${park.available === 0 ? colors.red : colors.border}`, padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{park.name}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim }}>📍 {park.area} &nbsp;|&nbsp; 💰 {park.rate}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: '700', color: park.available === 0 ? colors.red : park.available < 50 ? colors.amber : colors.green }}>{park.available}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim }}>/{park.slots} SLOTS</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: park.available === 0 ? colors.red : colors.green, marginTop: '4px' }}>
                      {park.available === 0 ? '❌ FULL' : '✅ AVAILABLE'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SOS TAB */}
          {activeTab === 'sos' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '16px', color: colors.red, letterSpacing: '4px' }}>EMERGENCY SOS</div>
              <button style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,61,0,0.2)', border: '4px solid #FF3D00', color: '#FF3D00', fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 0 40px rgba(255,61,0,0.4)', animation: 'sosPulse 2s infinite' }}
                onClick={() => alert('🚨 Emergency services notified! Help is on the way!')}>
                SOS
              </button>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, letterSpacing: '2px', textAlign: 'center' }}>
                PRESS TO CONTACT<br/>NEAREST POLICE & AMBULANCE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '20px' }}>
                {[
                  { label: 'POLICE', number: '100', icon: '👮' },
                  { label: 'AMBULANCE', number: '108', icon: '🚑' },
                  { label: 'FIRE', number: '101', icon: '🚒' },
                ].map((s, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${colors.red}`, padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: '700', color: colors.red }}>{s.number}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sosPulse { 0%, 100% { box-shadow: 0 0 40px rgba(255,61,0,0.4); } 50% { box-shadow: 0 0 80px rgba(255,61,0,0.8); } }
      `}</style>
    </div>
  )
}

export default CitizenDashboard