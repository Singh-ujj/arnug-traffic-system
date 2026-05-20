import React, { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

function Analytics() {
  const [trafficData, setTrafficData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (trafficData.length > 0) {
      drawCharts()
    }
  }, [trafficData])

  const fetchData = async () => {
    const { data } = await supabase
      .from('traffic_data')
      .select('*')
      .order('congestion_score', { ascending: false })
    if (data) {
      setTrafficData(data)
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
        plugins: {
          legend: { display: false }
        },
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
          label: 'Avg Speed (km/h)',
          data: trafficData.map(d => d.avg_speed),
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
        labels: ['Cars', 'Trucks', 'Buses', 'Bikes'],
        datasets: [{
          data: [58, 21, 14, 7],
          backgroundColor: [
            'rgba(46,204,64,0.7)',
            'rgba(0,229,255,0.7)',
            'rgba(255,193,7,0.7)',
            'rgba(139,195,74,0.7)'
          ],
          borderColor: ['#2ECC40', '#00E5FF', '#FFC107', '#8BC34A'],
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

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '400px', fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px', color: '#2ECC40', letterSpacing: '2px'
    }}>LOADING ANALYTICS DATA...</div>
  )

  return (
    <div>
      {/* Summary Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '20px'
      }}>
        {[
          { label: 'TOTAL VEHICLES', value: trafficData.reduce((a, b) => a + b.vehicles_count, 0).toLocaleString(), color: '#2ECC40' },
          { label: 'AVG CONGESTION', value: Math.round(trafficData.reduce((a, b) => a + b.congestion_score, 0) / trafficData.length) + '%', color: '#FFC107' },
          { label: 'CRITICAL ZONES', value: trafficData.filter(d => d.severity === 'critical').length, color: '#FF3D00' },
          { label: 'AVG SPEED', value: Math.round(trafficData.reduce((a, b) => a + b.avg_speed, 0) / trafficData.length) + ' km/h', color: '#00E5FF' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: colors.card, border: `1px solid ${colors.border}`,
            borderTop: `2px solid ${stat.color}`, padding: '14px 16px'
          }}>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: '9px',
              color: colors.textDim, letterSpacing: '2px', marginBottom: '8px'
            }}>{stat.label}</div>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: '24px',
              fontWeight: '700', color: stat.color
            }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Congestion Bar Chart */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
            color: colors.green, letterSpacing: '2px', marginBottom: '12px'
          }}>📊 CONGESTION SCORE BY AREA</div>
          <div style={{ position: 'relative', height: '220px' }}>
            <canvas id="congestionChart" role="img" aria-label="Congestion scores by area"></canvas>
          </div>
        </div>

        {/* Speed Line Chart */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
            color: '#00E5FF', letterSpacing: '2px', marginBottom: '12px'
          }}>📈 AVERAGE SPEED BY AREA (KM/H)</div>
          <div style={{ position: 'relative', height: '220px' }}>
            <canvas id="speedChart" role="img" aria-label="Average speed by area"></canvas>
          </div>
        </div>
      </div>

      {/* Vehicle + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

        {/* Donut Chart */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
            color: colors.green, letterSpacing: '2px', marginBottom: '12px'
          }}>🥧 VEHICLE TYPE BREAKDOWN</div>
          <div style={{ position: 'relative', height: '200px' }}>
            <canvas id="vehicleChart" role="img" aria-label="Vehicle type distribution"></canvas>
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.border}`,
          padding: '16px'
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
            color: colors.green, letterSpacing: '2px', marginBottom: '12px'
          }}>📋 DETAILED TRAFFIC DATA</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {['AREA', 'VEHICLES', 'SPEED', 'SCORE', 'STATUS'].map(h => (
                  <th key={h} style={{
                    fontFamily: 'Share Tech Mono, monospace', fontSize: '9px',
                    color: colors.textDim, letterSpacing: '1px',
                    padding: '6px 8px', textAlign: 'left',
                    borderBottom: `1px solid ${colors.border}`
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trafficData.map(zone => (
                <tr key={zone.id}>
                  <td style={{ padding: '8px', color: '#C8E6C9', fontSize: '12px' }}>{zone.area}</td>
                  <td style={{ padding: '8px', color: '#C8E6C9' }}>{zone.vehicles_count}</td>
                  <td style={{ padding: '8px', color: '#00E5FF' }}>{zone.avg_speed} km/h</td>
                  <td style={{ padding: '8px', fontFamily: 'Orbitron, monospace', fontSize: '11px',
                    color: zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40'
                  }}>{zone.congestion_score}%</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      fontFamily: 'Share Tech Mono, monospace', fontSize: '9px',
                      padding: '2px 6px', borderRadius: '2px',
                      background: zone.severity === 'critical' ? 'rgba(255,61,0,0.1)' : zone.severity === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(46,204,64,0.1)',
                      border: `1px solid ${zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40'}`,
                      color: zone.severity === 'critical' ? '#FF3D00' : zone.severity === 'warning' ? '#FFC107' : '#2ECC40'
                    }}>{zone.severity?.toUpperCase()}</span>
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