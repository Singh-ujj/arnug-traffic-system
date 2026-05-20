import React, { useState, useEffect } from 'react'

function AlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const colors = {
    card: '#081408', green: '#2ECC40', amber: '#FFC107',
    red: '#FF3D00', cyan: '#00E5FF', text: '#C8E6C9',
    textDim: '#2E7D32', border: 'rgba(46,204,64,0.15)'
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts/live')
      const data = await res.json()
      if (data.alerts) setAlerts(data.alerts)
    } catch (e) {
      console.log('Error fetching alerts')
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: colors.green, letterSpacing: '2px' }}>
      LOADING ALERTS...
    </div>
  )

  return (
    <div>
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        ⚠️ AUTO GENERATED ALERTS — TOMTOM LIVE
        <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', color: '#FF3D00', borderRadius: '2px', animation: 'blink 2s infinite' }}>
          {alerts.length} ACTIVE
        </span>
      </div>

      {alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: colors.textDim, letterSpacing: '2px' }}>
          ✅ NO CRITICAL ALERTS — TRAFFIC NORMAL
        </div>
      )}

      {alerts.map((alert, i) => (
        <div key={i} style={{
          background: colors.card,
          border: `1px solid ${alert.type === 'critical' ? colors.red : alert.type === 'warning' ? colors.amber : colors.green}`,
          borderLeft: `4px solid ${alert.type === 'critical' ? colors.red : alert.type === 'warning' ? colors.amber : colors.green}`,
          padding: '16px', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>
                {alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🟢'}
              </span>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: '700', color: alert.type === 'critical' ? colors.red : alert.type === 'warning' ? colors.amber : colors.green }}>
                {alert.area}
              </div>
            </div>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 8px', background: alert.type === 'critical' ? 'rgba(255,61,0,0.1)' : 'rgba(255,193,7,0.1)', border: `1px solid ${alert.type === 'critical' ? colors.red : colors.amber}`, color: alert.type === 'critical' ? colors.red : colors.amber, borderRadius: '2px' }}>
              {alert.type?.toUpperCase()}
            </span>
          </div>

          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: colors.text, marginBottom: '10px' }}>
            {alert.message}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'CONGESTION', value: `${alert.congestion_score}%`, color: alert.type === 'critical' ? colors.red : colors.amber },
              { label: 'CURRENT SPEED', value: `${alert.current_speed} km/h`, color: colors.cyan },
              { label: 'TIME', value: alert.time, color: colors.textDim },
            ].map((item, j) => (
              <div key={j} style={{ textAlign: 'center', background: 'rgba(46,204,64,0.03)', border: `1px solid ${colors.border}`, padding: '8px' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: colors.textDim, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {alert.incidents?.length > 0 && (
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '10px' }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, marginBottom: '6px', letterSpacing: '1px' }}>📋 INCIDENTS:</div>
              {alert.incidents.map((inc, k) => (
                <div key={k} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.amber, marginTop: '4px', padding: '4px 8px', background: 'rgba(255,193,7,0.05)', borderRadius: '2px' }}>
                  ⚠️ {inc.description} {inc.delay ? `— Delay: ${inc.delay}s` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default AlertsPanel