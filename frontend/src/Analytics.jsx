import React, { useEffect, useState } from 'react'

function Analytics() {
  const [trafficData, setTrafficData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (trafficData.length > 0) {
      setTimeout(drawCharts, 100)
    }
  }, [trafficData])

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traffic/live`)
      const data = await res.json()
      if (data.data) {
        setTrafficData(data.data)
        setLoading(false)
      }
    } catch (e) {
      console.log('Analytics fetch error:', e)
      setLoading(false)
    }
  }

  const drawCharts = () => {
    if (!window.Chart) return
    drawCongestionChart()
    drawSpeedChart()
    drawVehicleChart()
  }

  const drawCongestionChart = () => {
    const canvas = document.getElementById('congestionChart')
    if (!canvas) return
    if (canvas._chartInstance) canvas._chartInstance.destroy()
    const ctx = canvas.getContext('2d')
    canvas._chartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: trafficData.map(d => d.area.substring(0, 15)),
        datasets: [{
          label: 'Congestion Score',
          data: trafficData.map(d => d.congestion_score),
          backgroundColor: trafficData.map(d =>
            d.severity === 'critical' ? 'rgba(255,61,0,0.7)' :
            d.severity === 'warning' ? 'rgba(255,193,7,0.7)' :
            'rgba(46,204,64,0.7)'
          ),
          borderColor: trafficData.map(d =>
            d.severity === 'critical' ? '#FF3D00' :
            d.severity === 'warning' ? '#FFC107' : '#2ECC40'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true, max: 100,
            ticks: { color: '#2E7D32', font: { family: 'Share Tech Mono' } },
            grid: { color: 'rgba(46,204,64,0.1)' }
          },
          x: {
            ticks: { color: '#2E7D32', font: { family: 'Share Tech Mono', size: 9 } },
            grid: { color: 'rgba(46,204,64,0.1)' }
          }
        }
      }
    })
  }

  const drawSpeedChart = () => {
    const canvas = document.getElementById('speedChart')
    if (!canvas) return
    if (canvas._chartInstance) canvas._chartInstance.destroy()
    const ctx = canvas.getContext('2d')
    canvas._chartInstance = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: trafficData.map(d => d.area.substring(0, 12)),
        datasets: [{
          label: 'Current Speed (km/h)',
          data: trafficData.map(d => d.current_speed),
          borderColor: '#00E5FF',
          backgroundColor: 'rgba(0,229,255,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#00E5FF',
          pointRadius: 4,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#2E7D32', font: { family: 'Share Tech Mono' } },
            grid: { color: 'rgba(46,204,64,0.1)' }
          },
          x: {
            ticks: { color: '#2E7D32', font: { family: 'Share Tech Mono', size: 9 } },
            grid: { color: 'rgba(46,204,64,0.1)' }
          }
        }
      }
    })
  }

  const drawVehicleChart = () => {
    const canvas = document.getElementById('vehicleChart')
    if (!canvas) return
    if (canvas._chartInstance) canvas._chartInstance.destroy()
    const ctx = canvas.getContext('2d')
    canvas._chartInstance = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'Warning', 'Low'],
        datasets: [{
          data: [
            trafficData.filter(d => d.severity === 'critical').length,
            trafficData.filter(d => d.severity === 'warning').length,
            trafficData.filter(d => d.severity === 'low').length,
          ],
          backgroundColor: [
            'rgba(255,61,0,0.7)',
            'rgba(255,193,7,0.7)',
            'rgba(46,204,64,0.7)'
          ],
          borderColor: ['#FF3D00', '#FFC107', '#2ECC40'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#2E7D32',
              font: { family: 'Share Tech Mono', size: 10 },
              padding: 12
            }
          }
        }
      }
    })
  }

  const colors = {
    card: '#081408', border: 'rgba(46,204,64,0.15)',
    green: '#2ECC40', textDim: '#2E7D32'
  }

  const avgCongestion = trafficData.length > 0
    ? Math.round(trafficData.reduce((a, b) => a + b.congestion_score, 0) / trafficData.length)
    : 0

  const avgSpeed = trafficData.length > 0
    ? Math.round(trafficData.reduce((a, b) => a + b.current_speed, 0) / trafficData.length)
    : 0

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '400px', fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px', color: '#2ECC40', letterSpacing: '2px'
    }}>LOADING LIVE ANALYTICS...</div>
  )

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'ZONES MONITORED', value: trafficData.length, color: '#2ECC40' },
          { label: 'AVG CONGESTION', value: avgCongestion + '%', color: '#FFC107' },
          { label: 'CRITICAL ZONES', value: trafficData.filter(d => d.severity === 'critical').length, color: '#FF3D00' },
          { label: 'AVG SPEED', value: avgSpeed + ' km/h', color: '#00E5FF' }
        ].map((stat, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderTop: `2px solid ${stat.color}`, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '2px', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '24px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '12px' }}>
            📊 CONGESTION SCORE — LIVE TOMTOM
          </div>
          <div style={{ position: 'relative', height: '220px' }}>
            <canvas id="congestionChart"></canvas>
          </div>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#00E5FF', letterSpacing: '2px', marginBottom: '12px' }}>
            📈 CURRENT SPEED BY ZONE (KM/H)
          </div>
          <div style={{ position: 'relative', height: '220px' }}>
            <canvas id="speedChart"></canvas>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '12px' }}>
            🥧 SEVERITY DISTRIBUTION
          </div>
          <div style={{ position: 'relative', height: '200px' }}>
            <canvas id="vehicleChart"></canvas>
          </div>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '16px' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: colors.green, letterSpacing: '2px', marginBottom: '12px' }}>
            📋 LIVE TRAFFIC DATA — ALL ZONES
            <span style={{ marginLeft: '12px', fontSize: '9px', padding: '2px 8px', background: 'rgba(46,204,64,0.1)', border: '1px solid #2ECC40', borderRadius: '2px' }}>AUTO REFRESH 60s</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {['AREA', 'SPEED', 'FREE FLOW', 'CONGESTION', 'STATUS'].map(h => (
                  <th key={h} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: colors.textDim, letterSpacing: '1px', padding: '6px 8px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trafficData.map((zone, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px', color: '#C8E6C9', fontSize: '12px' }}>{zone.area}</td>
                  <td style={{ padding: '8px', color: '#00E5FF' }}>{zone.current_speed} km/h</td>
                  <td style={{ padding: '8px', color: '#2ECC40' }}>{zone.free_flow_speed} km/h</td>
                  <td style={{ padding: '8px', fontFamily: 'Orbitron, monospace', fontSize: '11px', color: zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40' }}>{zone.congestion_score}%</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', padding: '2px 6px', borderRadius: '2px', background: zone.severity === 'critical' ? 'rgba(255,61,0,0.1)' : zone.severity === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(46,204,64,0.1)', border: `1px solid ${zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40'}`, color: zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40' }}>{zone.severity?.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics