import React, { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

function MapView() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrafficData()
  }, [])

  useEffect(() => {
    if (zones.length > 0 && !mapInstanceRef.current) {
      initMap()
    }
  }, [zones])

  const fetchTrafficData = async () => {
    const { data, error } = await supabase
      .from('traffic_data')
      .select('*')
      .order('congestion_score', { ascending: false })
    if (data) {
      setZones(data)
      setLoading(false)
    }
  }

  const initMap = () => {
    if (!window.L || !mapRef.current) return

    const map = window.L.map(mapRef.current).setView([12.9716, 77.5946], 12)
    mapInstanceRef.current = map

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    zones.forEach(zone => {
      const color = zone.severity === 'critical' ? '#FF3D00' :
                    zone.severity === 'warning' ? '#FFC107' : '#2ECC40'

      const circle = window.L.circle([zone.lat, zone.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        radius: 500,
        weight: 2
      }).addTo(map)

      circle.bindPopup(`
        <div style="font-family: monospace; background: #020A04; color: #2ECC40; padding: 8px; border: 1px solid #2ECC40; min-width: 180px;">
          <strong style="color: ${color}">${zone.area}</strong><br/>
          <span>Vehicles: ${zone.vehicles_count}</span><br/>
          <span>Speed: ${zone.avg_speed} km/h</span><br/>
          <span>Score: ${zone.congestion_score}%</span><br/>
          <span style="color: ${color}">Status: ${zone.severity.toUpperCase()}</span>
        </div>
      `)

      window.L.marker([zone.lat, zone.lng], {
        icon: window.L.divIcon({
          html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px ${color}"></div>`,
          iconSize: [12, 12],
          className: ''
        })
      }).addTo(map).bindTooltip(zone.area, {
        permanent: false,
        direction: 'top',
        className: 'map-tooltip'
      })
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#020A04', zIndex: 10,
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '12px', color: '#2ECC40', letterSpacing: '2px'
        }}>
          LOADING SATELLITE MAP...
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '400px' }} />

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', marginTop: '12px',
        fontFamily: 'Share Tech Mono, monospace', fontSize: '10px'
      }}>
        {[
          { color: '#FF3D00', label: 'CRITICAL' },
          { color: '#FFC107', label: 'WARNING' },
          { color: '#2ECC40', label: 'CLEAR' }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: item.color, boxShadow: `0 0 6px ${item.color}`
            }} />
            <span style={{ color: item.color }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MapView