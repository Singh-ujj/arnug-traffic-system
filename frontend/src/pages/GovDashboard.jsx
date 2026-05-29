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
  const [stats, setStats] = useState({ vehicles_detected: 0, avg_speed: 0, congestion_zones: 0, ai_accuracy: 94.7 })
  const [citizenReports, setCitizenReports] = useState([])
  const [officers, setOfficers] = useState([])
  const [officerForm, setOfficerForm] = useState({ name: '', username: '', password: '', zone: '', contact: '' })
  const [officerMsg, setOfficerMsg] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    const logout = setTimeout(() => handleLogout(), 2 * 60 * 60 * 1000)
    return () => { clearInterval(interval); clearTimeout(logout) }
  }, [])

  const fetchAll = async () => {
    fetchStats()
    fetchLiveTraffic()
    fetchAlerts()
    fetchTopZones()
    fetchReports()
    fetchOfficers()
  }

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/officer/list`)
      const data = await res.json()
      if (data.officers) setOfficers(data.officers)
    } catch (e) { console.log('Officers error') }
  }

  const createOfficer = async () => {
    if (!officerForm.name || !officerForm.username || !officerForm.password || !officerForm.zone) {
      setOfficerMsg('❌ All fields required!')
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/officer/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...officerForm, created_by: 'commissioner' })
      })
      const data = await res.json()
      if (data.success) {
        setOfficerMsg('✅ Officer created successfully!')
        setOfficerForm({ name: '', username: '', password: '', zone: '', contact: '' })
        setShowCreateForm(false)
        fetchOfficers()
      } else {
        setOfficerMsg('❌ Failed — username may already exist!')
      }
    } catch (e) {
      setOfficerMsg('❌ Error creating officer!')
    }
    setTimeout(() => setOfficerMsg(''), 3000)
  }

  const fetchReports = async () => {
    try {
      const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10)
      if (data) setCitizenReports(data)
    } catch (e) { console.log('Reports error') }
  }

  const updateReportStatus = async (id, status) => {
    try {
      await supabase.from('reports').update({ status }).eq('id', id)
      fetchReports()
    } catch (e) { console.log('Update error') }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`)
      const data = await res.json()
      if (data.vehicles_detected !== undefined) setStats(data)
    } catch (e) { console.log('Stats error') }
  }

  const fetchTopZones = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traffic/predict`)
      const data = await res.json()
      if (data.predictions) setTopZones(data.predictions)
    } catch (e) {
      const { data: zones } = await supabase.from('traffic_data').select('*').order('congestion_score', { ascending: false }).limit(5)
      if (zones) setTopZones(zones)
    }
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/alerts/live`)
      const data = await res.json()
      if (data.alerts) setAlerts(data.alerts)
    } catch (e) {
      const { data: alertData } = await supabase.from('alerts').select('*').eq('is_active', true).limit(5)
      if (alertData) setAlerts(alertData)
    }
  }

  const fetchLiveTraffic = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traffic/live`)
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

  const resolved = citizenReports.filter(r => r.status === 'resolved').length
  const pending = citizenReports.filter(r => r.status === 'open' || r.status === 'pending').length

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    background: '#081408',
    border: `1px solid ${colors.borderBright}`,
    color: colors.text,
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: '12px', outline: 'none', borderRadius: '2px'
  }

  const zones = ['Whitefield', 'Marathahalli', 'Bellandur', 'Silk Board', 'Electronic City', 'HSR Layout', 'Koramangala', 'Outer Ring Road', 'Hebbal', 'Marathahalli IT']

  return (
    <div style={{ width: '100vw', height: '100vh', background: colors.bg, fontFamily: 'Rajdhani, sans-serif', color: colors.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
        <div style={{ width: '200px', background: colors.panel, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === tab.id ? 'rgba(46,204,64,0.1)' : 'transparent', borderLeft: activeTab === tab.id ? `3px solid ${colors.green}` : '3px solid transparent', color: activeTab === tab.id ? colors.green : colors.textDim, fontSize: '13px', fontWeight: '600', letterSpacing: '1px', transition: 'all 0.2s' }}>
              <span>{tab.icon}</span>{tab.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'VEHICLES DETECTED', value: stats.vehicles_detected.toLocaleString(), color: colors.green, delta: '↑ TomTom Live Data' },
                  { label: 'AVG SPEED (KM/H)', value: stats.avg_speed, color: colors.amber, delta: 'Live across all zones' },
                  { label: 'CONGESTION ZONES', value: stats.congestion_zones, color: colors.red, delta: 'Critical + Warning' },
                  { label: 'AI ACCURACY', value: stats.ai_accuracy + '%', color: colors.cyan, delta: 'FCN + TomTom' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${stat.color}`, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: '700', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '6px' }}>{stat.delta}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  TOP 5 CONGESTION ZONES — LIVE TOMTOM DATA
                  <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', color: '#FF3D00', borderRadius: '2px', animation: 'blink 2s infinite' }}>LIVE</span>
                </div>
                {topZones.length === 0 ? (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '20px' }}>Loading live zone data...</div>
                ) : (
                  topZones.map((zone, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', marginBottom: '8px', background: 'rgba(46,204,64,0.03)', border: `1px solid ${colors.border}` }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: '700', color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green, width: '30px' }}>#{i+1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{zone.area}</div>
                        <div style={{ height: '4px', background: colors.border, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (zone.congestion_score || zone.predicted_score) + '%', background: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green, borderRadius: '2px' }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: '700', color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green }}>{zone.congestion_score || zone.predicted_score}%</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: zone.severity === 'critical' ? 'rgba(255,61,0,0.1)' : zone.severity === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(46,204,64,0.1)', border: `1px solid ${zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green}`, color: zone.severity === 'critical' ? colors.red : zone.severity === 'warning' ? colors.amber : colors.green }}>{zone.severity?.toUpperCase()}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  LIVE AUTO GENERATED ALERTS
                  <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, borderRadius: '2px' }}>{alerts.length} ACTIVE</span>
                </div>
                {alerts.length === 0 ? (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '20px' }}>✅ No active alerts — Traffic normal</div>
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 12px', marginBottom: '8px', borderLeft: `2px solid ${alert.type === 'critical' ? colors.red : alert.type === 'warning' ? colors.amber : colors.cyan}`, background: alert.type === 'critical' ? 'rgba(255,61,0,0.05)' : 'rgba(255,193,7,0.05)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: alert.type === 'critical' ? colors.red : colors.amber }}>{alert.area}</div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '2px' }}>{alert.message}</div>
                      </div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, whiteSpace: 'nowrap' }}>{alert.time || 'Just now'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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

          {activeTab === 'map' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>🗺️ LIVE SATELLITE TRAFFIC MAP — BANGALORE</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <MapView />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>📈 TRAFFIC ANALYTICS — REAL TIME DATA</div>
              <Analytics />
            </div>
          )}

          {activeTab === 'routes' && <RoutesFinder />}
          {activeTab === 'alerts' && <AlertsPanel />}

          {/* OFFICERS TAB — LIVE + CREATE */}
          {activeTab === 'officers' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                👮 FIELD OFFICERS — BANGALORE TRAFFIC POLICE
                <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '6px 16px', background: 'rgba(46,204,64,0.2)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', cursor: 'pointer', borderRadius: '2px', letterSpacing: '1px' }}>
                  {showCreateForm ? '✕ CANCEL' : '+ CREATE OFFICER'}
                </button>
              </div>

              {/* Create Officer Form */}
              {showCreateForm && (
                <div style={{ background: colors.card, border: `1px solid ${colors.borderBright}`, padding: '20px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>🔐 CREATE NEW OFFICER ACCOUNT</div>
                  {officerMsg && (
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: officerMsg.includes('✅') ? colors.green : colors.red, padding: '8px 12px', background: officerMsg.includes('✅') ? 'rgba(46,204,64,0.1)' : 'rgba(255,61,0,0.1)', border: `1px solid ${officerMsg.includes('✅') ? colors.green : colors.red}`, borderRadius: '2px', marginBottom: '12px', textAlign: 'center' }}>{officerMsg}</div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>FULL NAME</div>
                      <input style={inputStyle} placeholder="Officer full name" value={officerForm.name} onChange={e => setOfficerForm({...officerForm, name: e.target.value})} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>USERNAME</div>
                      <input style={inputStyle} placeholder="Login username" value={officerForm.username} onChange={e => setOfficerForm({...officerForm, username: e.target.value})} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>PASSWORD</div>
                      <input style={inputStyle} type="password" placeholder="Login password" value={officerForm.password} onChange={e => setOfficerForm({...officerForm, password: e.target.value})} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>ASSIGNED ZONE</div>
                      <select style={inputStyle} value={officerForm.zone} onChange={e => setOfficerForm({...officerForm, zone: e.target.value})}>
                        <option value="">-- Select Zone --</option>
                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>CONTACT NUMBER</div>
                      <input style={inputStyle} placeholder="+91-XXXXXXXXXX" value={officerForm.contact} onChange={e => setOfficerForm({...officerForm, contact: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={createOfficer} style={{ width: '100%', padding: '10px', background: 'rgba(46,204,64,0.2)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', cursor: 'pointer', borderRadius: '2px' }}>
                    CREATE OFFICER ACCOUNT →
                  </button>
                </div>
              )}

              {/* Officers List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {officers.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '40px' }}>
                    No officers created yet — Click "CREATE OFFICER" to add one!
                  </div>
                ) : (
                  officers.map((officer, i) => (
                    <div key={i} style={{ background: colors.card, border: `1px solid ${colors.borderBright}`, padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', color: colors.green }}>👮 {officer.name}</div>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, color: colors.green, borderRadius: '2px' }}>ACTIVE</span>
                      </div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '6px' }}>📍 Zone: <span style={{ color: colors.amber }}>{officer.zone}</span></div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '6px' }}>👤 Username: <span style={{ color: colors.cyan }}>{officer.username}</span></div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim }}>Created: {new Date(officer.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                📋 CITIZEN REPORTS — LIVE SUPABASE
                <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, borderRadius: '2px' }}>{citizenReports.length} TOTAL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'TOTAL REPORTS', value: citizenReports.length, color: colors.cyan, delta: 'From citizens' },
                  { label: 'RESOLVED', value: resolved, color: colors.green, delta: `${citizenReports.length > 0 ? Math.round(resolved / citizenReports.length * 100) : 0}% resolution rate` },
                  { label: 'PENDING', value: pending, color: colors.red, delta: 'Requires attention' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${stat.color}`, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '6px' }}>{stat.delta}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>RECENT CITIZEN REPORTS</div>
                {citizenReports.length === 0 ? (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '40px' }}>✅ No reports submitted yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['TYPE', 'AREA', 'DESCRIPTION', 'STATUS', 'TIME', 'ACTION'].map(h => (
                          <th key={h} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, padding: '8px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {citizenReports.map((report, i) => (
                        <tr key={i}>
                          <td style={{ padding: '10px 8px', fontSize: '12px', color: colors.text }}>{report.type}</td>
                          <td style={{ padding: '10px 8px', fontSize: '12px', color: colors.cyan }}>{report.area}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', color: colors.textDim }}>{report.description?.substring(0, 40)}...</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: report.status === 'resolved' ? 'rgba(46,204,64,0.1)' : 'rgba(255,61,0,0.1)', border: `1px solid ${report.status === 'resolved' ? colors.green : colors.red}`, color: report.status === 'resolved' ? colors.green : colors.red }}>{report.status?.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '10px 8px', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim }}>{new Date(report.created_at).toLocaleTimeString()}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {report.status !== 'resolved' && (
                                <button onClick={() => updateReportStatus(report.id, 'resolved')} style={{ padding: '3px 8px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', cursor: 'pointer', borderRadius: '2px' }}>✓</button>
                              )}
                              {report.status === 'open' && (
                                <button onClick={() => updateReportStatus(report.id, 'in_progress')} style={{ padding: '3px 8px', background: 'rgba(255,193,7,0.1)', border: `1px solid ${colors.amber}`, color: colors.amber, fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', cursor: 'pointer', borderRadius: '2px' }}>→</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>⚙️ SYSTEM SETTINGS — ARNUG CONTROL</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { title: '🔔 ALERT SETTINGS', items: [
                    { label: 'Auto Alert System', value: 'ACTIVE', color: colors.green },
                    { label: 'Alert Interval', value: '5 minutes', color: colors.cyan },
                    { label: 'Critical Threshold', value: '70%', color: colors.red },
                    { label: 'Warning Threshold', value: '40%', color: colors.amber },
                    { label: 'Supabase Sync', value: 'ENABLED', color: colors.green },
                  ]},
                  { title: '🛰️ API STATUS', items: [
                    { label: 'TomTom Live API', value: 'CONNECTED', color: colors.green },
                    { label: 'Data Refresh Rate', value: '60 seconds', color: colors.cyan },
                    { label: 'Supabase DB', value: 'CONNECTED', color: colors.green },
                    { label: 'Backend Server', value: 'RUNNING', color: colors.green },
                    { label: 'FCN Model', value: 'LOADED', color: colors.cyan },
                    { label: 'A* Algorithm', value: 'ACTIVE', color: colors.green },
                  ]},
                  { title: '🌐 SYSTEM INFO', items: [
                    { label: 'Version', value: 'v4.0.0', color: colors.cyan },
                    { label: 'Frontend', value: 'React + Vite', color: colors.cyan },
                    { label: 'Backend', value: 'FastAPI', color: colors.cyan },
                    { label: 'Database', value: 'Supabase', color: colors.cyan },
                    { label: 'Deployed At', value: 'arnug.in', color: colors.green },
                    { label: 'College', value: 'RVCE Bengaluru', color: colors.cyan },
                  ]},
                ].map((section, si) => (
                  <div key={si} style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '20px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>{section.title}</div>
                    {section.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim }}>{item.label}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: item.color, fontWeight: '700' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                ))}
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