import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import MapView from '../MapView.jsx'
import Analytics from '../Analytics.jsx'
import RoutesFinder from './RoutesFinder.jsx'
import AlertsPanel from './AlertsPanel.jsx'
function GovDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [topZones, setTopZones] = useState([])
  const [alerts, setAlerts] = useState([])
  const [liveTraffic, setLiveTraffic] = useState([])
  const [stats, setStats] = useState({ vehicles_detected: 2847, avg_speed: 34, congestion_zones: 7, ai_accuracy: 94.7 })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchSupabaseData()
    fetchLiveTraffic()
    const interval = setInterval(fetchLiveTraffic, 60000)
    const logout = setTimeout(() => handleLogout(), 2 * 60 * 60 * 1000)
    return () => { clearInterval(interval); clearTimeout(logout) }
  }, [])

  const fetchSupabaseData = async () => {
    const { data: zones } = await supabase.from('traffic_data').select('*').order('congestion_score', { ascending: false }).limit(5)
    if (zones) setTopZones(zones)
    const { data: alertData } = await supabase.from('alerts').select('*').eq('is_active', true).limit(5)
    if (alertData) setAlerts(alertData)
  }

  const fetchLiveTraffic = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/traffic/live')
      const data = await res.json()
      if (data.data) setLiveTraffic(data.data)
    } catch (e) { console.log('Backend not connected') }
  }

  const handleLogout = () => {
    localStorage.removeItem('arnug_user')
    localStorage.removeItem('arnug_type')
    localStorage.removeItem('arnug_token')
    setUser(null)
  }

  const colors = {
    bg: '#020A04', panel: '#061008', card: '#081408',
    green: '#2ECC40', greenDim: '#0D3B0D',
    amber: '#FFC107', red: '#FF3D00', cyan: '#00E5FF',
    text: '#C8E6C9', textDim: '#2E7D32',
    border: 'rgba(46,204,64,0.15)', borderBright: 'rgba(46,204,64,0.4)'
  }

  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
    { id: 'map', label: 'LIVE MAP', icon: '🗺️' },
    { id: 'analytics', label: 'ANALYTICS', icon: '📈' },
    { id: 'live', label: 'LIVE TRAFFIC', icon: '🚦' },
    { id: 'routes', label: 'ROUTES', icon: '🛣️' },
    { id: 'alerts', label: 'ALERTS', icon: '⚠️' },
    { id: 'officers', label: 'OFFICERS', icon: '👮' },
    { id: 'reports', label: 'REPORTS', icon: '📋' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙️' },
  ]

  return (
    <div style={{ width: '100vw', height: '100vh', background: colors.bg, fontFamily: 'Rajdhani, sans-serif', color: colors.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* TOP BAR */}
      <div style={{ height: '56px', background: colors.panel, borderBottom: `1px solid ${colors.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: '900', color: colors.green, letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: colors.green, borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          ARNUG — GOV CONTROL
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, letterSpacing: '2px', textAlign: 'center' }}>
          TRAFFIC ANALYSIS & MANAGEMENT SYSTEM<br/>
          <span style={{ color: colors.green }}>{currentTime.toLocaleDateString()} | {currentTime.toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.green, padding: '3px 10px', border: `1px solid ${colors.green}`, borderRadius: '2px' }}>
            👮 {user?.name || 'COMMISSIONER'}
          </div>
          <button onClick={handleLogout} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', letterSpacing: '2px', padding: '4px 12px', background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', color: '#FF3D00', cursor: 'pointer', borderRadius: '2px' }}>LOGOUT</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '200px', background: colors.panel, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === tab.id ? 'rgba(46,204,64,0.1)' : 'transparent', borderLeft: activeTab === tab.id ? `3px solid ${colors.green}` : '3px solid transparent', color: activeTab === tab.id ? colors.green : colors.textDim, fontSize: '13px', fontWeight: '600', letterSpacing: '1px', transition: 'all 0.2s' }}>
              <span>{tab.icon}</span>{tab.label}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'VEHICLES DETECTED', value: stats.vehicles_detected.toLocaleString(), color: colors.green, delta: '↑ +134 vs last scan' },
                  { label: 'AVG SPEED (KM/H)', value: stats.avg_speed, color: colors.amber, delta: '↓ -8 vs normal' },
                  { label: 'CONGESTION ZONES', value: stats.congestion_zones, color: colors.red, delta: '↑ HIGH ×2' },
                  { label: 'AI ACCURACY', value: stats.ai_accuracy + '%', color: colors.cyan, delta: 'YOLOv9 + SAM' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${stat.color}`, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: '700', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '6px' }}>{stat.delta}</div>
                  </div>
                ))}
              </div>

              {/* Top 5 Zones */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  TOP 5 PREDICTED CONGESTION ZONES — NEXT 15 MIN
                  <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', color: '#FF3D00', borderRadius: '2px', animation: 'blink 2s infinite' }}>LIVE AI</span>
                </div>
                {topZones.map((zone, i) => (
                  <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', marginBottom: '8px', background: 'rgba(46,204,64,0.03)', border: `1px solid ${colors.border}` }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: '700', color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green, width: '30px' }}>#{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{zone.area}</div>
                      <div style={{ height: '4px', background: colors.border, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: zone.congestion_score + '%', background: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green, borderRadius: '2px' }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: '700', color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green }}>{zone.congestion_score}%</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: zone.severity === 'critical' ? 'rgba(255,61,0,0.1)' : zone.severity === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(46,204,64,0.1)', border: `1px solid ${zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green}`, color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green }}>{zone.severity?.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>AUTO GENERATED ALERTS</div>
                {alerts.map(alert => (
                  <div key={alert.id} style={{ display: 'flex', gap: '12px', padding: '10px 12px', marginBottom: '8px', borderLeft: `2px solid ${alert.type === 'critical' ? colors.red : alert.type === 'warning' ? colors.amber : colors.cyan}`, background: alert.type === 'critical' ? 'rgba(255,61,0,0.05)' : 'rgba(255,193,7,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{alert.area}</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '2px' }}>{alert.message}</div>
                    </div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim }}>{new Date(alert.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE TRAFFIC */}
          {activeTab === 'live' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>
                🚦 LIVE TRAFFIC — TOMTOM REAL-TIME DATA
                <span style={{ marginLeft: '12px', fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: '1px solid #2ECC40', borderRadius: '2px' }}>AUTO REFRESH 60s</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {liveTraffic.map((zone, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.border}`, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{zone.area}</div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', background: zone.severity === 'critical' ? 'rgba(255,61,0,0.1)' : zone.severity === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(46,204,64,0.1)', border: `1px solid ${zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green}`, color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green, borderRadius: '2px' }}>{zone.severity?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      {[
                        { label: 'CURRENT', value: `${zone.current_speed} km/h`, color: colors.cyan },
                        { label: 'FREE FLOW', value: `${zone.free_flow_speed} km/h`, color: colors.green },
                        { label: 'CONGESTION', value: `${zone.congestion_score}%`, color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green },
                      ].map((item, j) => (
                        <div key={j} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginBottom: '4px' }}>{item.label}</div>
                          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: '700', color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {zone.incidents?.length > 0 && (
                      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '8px' }}>
                        {zone.incidents.slice(0,2).map((inc, k) => (
                          <div key={k} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.amber, marginTop: '4px' }}>⚠️ {inc.description}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginTop: '8px' }}>📡 {zone.source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAP */}
          {activeTab === 'map' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>🗺️ LIVE SATELLITE TRAFFIC MAP — BANGALORE</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <MapView />
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>📈 TRAFFIC ANALYTICS — REAL TIME DATA</div>
              <Analytics />
            </div>
          )}

          {/* ROUTES */}
          {activeTab === 'routes' && <RoutesFinder />}

          {/* OTHER TABS */}
          {!['dashboard','map','analytics','live','routes'].includes(activeTab) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '40px', color: colors.greenDim }}>🛰️</div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: colors.textDim, letterSpacing: '3px', textAlign: 'center' }}>
                {activeTab.toUpperCase()} MODULE<br/>
                <span style={{ color: colors.green }}>COMING SOON</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

export default GovDashboard