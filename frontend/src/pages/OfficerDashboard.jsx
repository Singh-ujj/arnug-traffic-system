import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

function OfficerDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [zoneTraffic, setZoneTraffic] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [routes, setRoutes] = useState([])
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [areas, setAreas] = useState([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [reportForm, setReportForm] = useState({ type: 'accident', description: '' })
  const [reportSent, setReportSent] = useState(false)
  const [zoneReports, setZoneReports] = useState([])

  const officerZone = user?.zone || 'Whitefield'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = async () => {
    fetchZoneTraffic()
    fetchAlerts()
    fetchAreas()
    fetchZoneReports()
  }

  const fetchZoneTraffic = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traffic/zone/${encodeURIComponent(officerZone)}`)
      const data = await res.json()
      setZoneTraffic(data)
    } catch (e) { console.log('Zone traffic error') }
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/alerts/live`)
      const data = await res.json()
      if (data.alerts) {
        const zoneAlerts = data.alerts.filter(a => a.area === officerZone)
        setAlerts(zoneAlerts)
      }
    } catch (e) { console.log('Alerts error') }
  }

  const fetchAreas = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/areas`)
      const data = await res.json()
      if (data.areas) setAreas(data.areas)
    } catch (e) {}
  }

  const fetchZoneReports = async () => {
    try {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('area', officerZone)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setZoneReports(data)
    } catch (e) { console.log('Reports error') }
  }

  const findRoute = async () => {
    if (!origin || !destination) return
    setLoadingRoute(true)
    setRoutes([])
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/routes/suggest`, {
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
    if (!reportForm.description) return
    try {
      await supabase.from('reports').insert([{
        type: reportForm.type,
        area: officerZone,
        description: reportForm.description,
        status: 'open'
      }])
      setReportSent(true)
      setReportForm({ type: 'accident', description: '' })
      setTimeout(() => setReportSent(false), 3000)
      fetchZoneReports()
    } catch (e) {}
  }

  const updateReportStatus = async (id, status) => {
    await supabase.from('reports').update({ status }).eq('id', id)
    fetchZoneReports()
  }

  const handleLogout = () => {
    localStorage.removeItem('arnug_user')
    localStorage.removeItem('arnug_type')
    setUser(null)
  }

  const colors = {
    bg: '#020A04', panel: '#061008', card: '#081408',
    green: '#2ECC40', amber: '#FFC107', red: '#FF3D00', cyan: '#00E5FF',
    text: '#C8E6C9', textDim: '#2E7D32',
    border: 'rgba(46,204,64,0.15)', borderBright: 'rgba(46,204,64,0.4)'
  }

  const tabs = [
    { id: 'dashboard', label: 'MY ZONE', icon: '📍' },
    { id: 'routes', label: 'ROUTES', icon: '🛣️' },
    { id: 'report', label: 'REPORT', icon: '📢' },
    { id: 'zone_reports', label: 'ZONE REPORTS', icon: '📋' },
  ]

  const selectStyle = {
    width: '100%', padding: '10px 14px',
    background: '#081408',
    border: `1px solid ${colors.borderBright}`,
    color: colors.green,
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: '13px', outline: 'none',
    borderRadius: '2px', cursor: 'pointer'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: colors.bg, fontFamily: 'Rajdhani, sans-serif', color: colors.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* TOP BAR */}
      <div style={{ height: '56px', background: colors.panel, borderBottom: `1px solid ${colors.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '16px', fontWeight: '900', color: colors.green, letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: colors.green, borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          ARNUG — OFFICER CONTROL
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, letterSpacing: '2px', textAlign: 'center' }}>
          ZONE: <span style={{ color: colors.amber, fontWeight: '700' }}>{officerZone.toUpperCase()}</span><br/>
          <span style={{ color: colors.green }}>{currentTime.toLocaleDateString()} | {currentTime.toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.green, padding: '3px 10px', border: `1px solid ${colors.green}`, borderRadius: '2px' }}>
            👮 {user?.name || 'OFFICER'}
          </div>
          <button onClick={handleLogout} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', padding: '4px 12px', background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', color: '#FF3D00', cursor: 'pointer', borderRadius: '2px' }}>LOGOUT</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '200px', background: colors.panel, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0 }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === tab.id ? 'rgba(46,204,64,0.1)' : 'transparent', borderLeft: activeTab === tab.id ? `3px solid ${colors.green}` : '3px solid transparent', color: activeTab === tab.id ? colors.green : colors.textDim, fontSize: '13px', fontWeight: '600', letterSpacing: '1px', transition: 'all 0.2s' }}>
              <span>{tab.icon}</span>{tab.label}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

          {/* MY ZONE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>
                📍 MY ZONE — {officerZone.toUpperCase()} — LIVE TOMTOM DATA
              </div>

              {/* Zone Traffic Card */}
              {zoneTraffic && (
                <div style={{ background: colors.card, border: `2px solid ${zoneTraffic.severity === 'critical' ? colors.red : zoneTraffic.severity === 'warning' ? colors.amber : colors.green}`, padding: '24px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: '700', color: colors.green }}>{zoneTraffic.area}</div>
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', padding: '4px 16px', background: zoneTraffic.severity === 'critical' ? 'rgba(255,61,0,0.2)' : zoneTraffic.severity === 'warning' ? 'rgba(255,193,7,0.2)' : 'rgba(46,204,64,0.2)', border: `1px solid ${zoneTraffic.severity === 'critical' ? colors.red : zoneTraffic.severity === 'warning' ? colors.amber : colors.green}`, color: zoneTraffic.severity === 'critical' ? colors.red : zoneTraffic.severity === 'warning' ? colors.amber : colors.green, borderRadius: '2px' }}>{zoneTraffic.severity?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    {[
                      { label: 'CURRENT SPEED', value: `${zoneTraffic.current_speed} km/h`, color: colors.cyan },
                      { label: 'FREE FLOW', value: `${zoneTraffic.free_flow_speed} km/h`, color: colors.green },
                      { label: 'CONGESTION', value: `${zoneTraffic.congestion_score}%`, color: zoneTraffic.severity === 'critical' ? colors.red : zoneTraffic.severity === 'warning' ? colors.amber : colors.green },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'rgba(46,204,64,0.03)', border: `1px solid ${colors.border}`, padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '8px' }}>{item.label}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '24px', fontWeight: '700', color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Congestion bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px' }}>CONGESTION LEVEL</div>
                    <div style={{ height: '8px', background: colors.border, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${zoneTraffic.congestion_score}%`, background: zoneTraffic.severity === 'critical' ? colors.red : zoneTraffic.severity === 'warning' ? colors.amber : colors.green, borderRadius: '4px', transition: 'width 1s' }} />
                    </div>
                  </div>

                  {zoneTraffic.incidents?.length > 0 && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '8px' }}>⚠️ ACTIVE INCIDENTS</div>
                      {zoneTraffic.incidents.map((inc, i) => (
                        <div key={i} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.amber, padding: '6px 10px', background: 'rgba(255,193,7,0.05)', marginBottom: '4px', borderLeft: `2px solid ${colors.amber}` }}>
                          {inc.description} {inc.delay ? `— Delay: ${inc.delay}s` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginTop: '12px' }}>📡 {zoneTraffic.source} | Last updated: {currentTime.toLocaleTimeString()}</div>
                </div>
              )}

              {/* Zone Alerts */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  MY ZONE ALERTS
                  <span style={{ fontSize: '9px', padding: '2px 8px', background: alerts.length > 0 ? 'rgba(255,61,0,0.1)' : 'rgba(46,204,64,0.1)', border: `1px solid ${alerts.length > 0 ? colors.red : colors.green}`, color: alerts.length > 0 ? colors.red : colors.green, borderRadius: '2px' }}>{alerts.length} ACTIVE</span>
                </div>
                {alerts.length === 0 ? (
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '20px' }}>✅ No alerts in {officerZone} — Traffic normal</div>
                ) : (
                  alerts.map((alert, i) => (
                    <div key={i} style={{ padding: '10px 12px', marginBottom: '8px', borderLeft: `3px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, background: 'rgba(255,61,0,0.05)' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: alert.type === 'critical' ? colors.red : colors.amber }}>{alert.area}</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginTop: '4px' }}>{alert.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ROUTES */}
          {activeTab === 'routes' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>🛣️ AI ROUTE FINDER — A* + TOMTOM LIVE</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.borderBright}`, padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '8px' }}>📍 FROM</div>
                    <select value={origin} onChange={e => setOrigin(e.target.value)} style={selectStyle}>
                      <option value="">-- Select --</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '8px' }}>🎯 TO</div>
                    <select value={destination} onChange={e => setDestination(e.target.value)} style={selectStyle}>
                      <option value="">-- Select --</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <button onClick={findRoute} disabled={loadingRoute || !origin || !destination} style={{ padding: '10px 20px', background: 'rgba(46,204,64,0.2)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: '700', cursor: 'pointer', borderRadius: '2px' }}>
                    {loadingRoute ? 'FINDING...' : 'FIND'}
                  </button>
                </div>
              </div>
              {routes.map((route, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${i === 0 ? colors.green : colors.border}`, borderLeft: `4px solid ${i === 0 ? colors.green : i === 1 ? colors.amber : colors.cyan}`, padding: '16px', marginBottom: '12px' }}>
                  {i === 0 && <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.green, marginBottom: '8px' }}>⭐ RECOMMENDED</div>}
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', color: i === 0 ? colors.green : i === 1 ? colors.amber : colors.cyan, marginBottom: '10px' }}>#{i+1} {route.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { label: 'DISTANCE', value: route.distance },
                      { label: 'TIME', value: route.time },
                      { label: 'SOURCE', value: route.source },
                    ].map((s, j) => (
                      <div key={j} style={{ textAlign: 'center', background: 'rgba(46,204,64,0.03)', border: `1px solid ${colors.border}`, padding: '8px' }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: '700', color: colors.green }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim }}>🗺️ {route.via}</div>
                </div>
              ))}
            </div>
          )}

          {/* REPORT */}
          {activeTab === 'report' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px' }}>📢 REPORT INCIDENT — {officerZone.toUpperCase()}</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '24px' }}>
                {reportSent && (
                  <div style={{ background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                    ✅ INCIDENT REPORTED SUCCESSFULLY!
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '8px' }}>INCIDENT TYPE</div>
                  <select value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value})} style={selectStyle}>
                    <option value="accident">🚗 Accident</option>
                    <option value="roadblock">🚧 Road Block</option>
                    <option value="signal">🚦 Signal Issue</option>
                    <option value="crowd">👥 Crowd Control</option>
                    <option value="vip">🚨 VIP Movement</option>
                    <option value="other">⚠️ Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '8px' }}>ZONE: <span style={{ color: colors.amber }}>{officerZone}</span> (Auto-filled)</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.textDim, marginBottom: '8px' }}>INCIDENT DESCRIPTION</div>
                  <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} placeholder="Describe the incident..." rows={4} style={{ width: '100%', padding: '10px 14px', background: '#081408', border: `1px solid ${colors.borderBright}`, color: colors.text, fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', outline: 'none', borderRadius: '2px', resize: 'vertical' }} />
                </div>
                <button onClick={submitReport} style={{ width: '100%', padding: '12px', background: 'rgba(46,204,64,0.2)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', cursor: 'pointer', borderRadius: '2px' }}>
                  SUBMIT REPORT
                </button>
              </div>
            </div>
          )}

          {/* ZONE REPORTS */}
          {activeTab === 'zone_reports' && (
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                📋 ZONE REPORTS — {officerZone.toUpperCase()}
                <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, borderRadius: '2px' }}>{zoneReports.length} TOTAL</span>
              </div>
              {zoneReports.length === 0 ? (
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: colors.textDim, textAlign: 'center', padding: '60px' }}>✅ No reports for {officerZone}</div>
              ) : (
                zoneReports.map((report, i) => (
                  <div key={i} style={{ background: colors.card, border: `1px solid ${report.status === 'open' ? colors.red : report.status === 'in_progress' ? colors.amber : colors.border}`, padding: '16px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', color: colors.green }}>{report.type?.toUpperCase()}</div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: report.status === 'resolved' ? 'rgba(46,204,64,0.1)' : report.status === 'open' ? 'rgba(255,61,0,0.1)' : 'rgba(255,193,7,0.1)', border: `1px solid ${report.status === 'resolved' ? colors.green : report.status === 'open' ? colors.red : colors.amber}`, color: report.status === 'resolved' ? colors.green : report.status === 'open' ? colors.red : colors.amber }}>{report.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text, marginBottom: '8px' }}>{report.description}</div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '12px' }}>{new Date(report.created_at).toLocaleString()}</div>
                    {report.status !== 'resolved' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {report.status === 'open' && (
                          <button onClick={() => updateReportStatus(report.id, 'in_progress')} style={{ padding: '4px 12px', background: 'rgba(255,193,7,0.1)', border: `1px solid ${colors.amber}`, color: colors.amber, fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', cursor: 'pointer', borderRadius: '2px' }}>→ IN PROGRESS</button>
                        )}
                        <button onClick={() => updateReportStatus(report.id, 'resolved')} style={{ padding: '4px 12px', background: 'rgba(46,204,64,0.1)', border: `1px solid ${colors.green}`, color: colors.green, fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', cursor: 'pointer', borderRadius: '2px' }}>✓ RESOLVE</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

export default OfficerDashboard