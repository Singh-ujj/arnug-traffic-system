import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

function GovLogin({ setUser, setUserType }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('gov_users')
        .select('*')
        .eq('username', credentials.username)
        .eq('password', credentials.password)
        .eq('authorized', true)
        .single()

      if (error || !data) {
        setError('INVALID CREDENTIALS — ACCESS DENIED')
        setLoading(false)
        return
      }

      const user = { username: data.username, name: data.name, role: data.role, zone: data.zone }
      localStorage.setItem('arnug_user', JSON.stringify(user))
      localStorage.setItem('arnug_type', 'government')
      setUser(user)
      setUserType('government')

      // Role ke hisaab se route karo
      if (data.role === 'commissioner') {
        navigate('/gov-dashboard')
      } else {
        navigate('/officer-dashboard')
      }
    } catch (err) {
      setError('CONNECTION ERROR — TRY AGAIN')
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#020A04',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Rajdhani, sans-serif',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(46,204,64,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(46,204,64,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {[
        { top: 20, left: 20, borderWidth: '2px 0 0 2px' },
        { top: 20, right: 20, borderWidth: '2px 2px 0 0' },
        { bottom: 20, left: 20, borderWidth: '0 0 2px 2px' },
        { bottom: 20, right: 20, borderWidth: '0 2px 2px 0' }
      ].map((style, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '40px', height: '40px',
          borderStyle: 'solid',
          borderColor: 'rgba(46,204,64,0.4)',
          ...style
        }} />
      ))}

      <div style={{
        background: '#061008',
        border: '1px solid rgba(46,204,64,0.4)',
        padding: '40px',
        width: '400px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #2ECC40, transparent)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px' }}>⚖️</div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '16px', fontWeight: '700',
            color: '#2ECC40', letterSpacing: '4px',
            marginTop: '8px'
          }}>GOVERNMENT ACCESS</div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#2E7D32',
            letterSpacing: '2px', marginTop: '4px'
          }}>AUTHORIZED PERSONNEL ONLY</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#2E7D32',
            letterSpacing: '2px', marginBottom: '8px'
          }}>OFFICER ID</div>
          <input
            type="text"
            value={credentials.username}
            onChange={e => setCredentials({...credentials, username: e.target.value})}
            placeholder="Enter officer ID"
            style={{
              width: '100%', padding: '10px 14px',
              background: '#081408',
              border: '1px solid rgba(46,204,64,0.3)',
              color: '#C8E6C9',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '13px', letterSpacing: '1px',
              outline: 'none', borderRadius: '2px'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#2E7D32',
            letterSpacing: '2px', marginBottom: '8px'
          }}>ACCESS CODE</div>
          <input
            type="password"
            value={credentials.password}
            onChange={e => setCredentials({...credentials, password: e.target.value})}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter access code"
            style={{
              width: '100%', padding: '10px 14px',
              background: '#081408',
              border: '1px solid rgba(46,204,64,0.3)',
              color: '#C8E6C9',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '13px', letterSpacing: '1px',
              outline: 'none', borderRadius: '2px'
            }}
          />
        </div>

        {error && (
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#FF3D00',
            letterSpacing: '1px', marginBottom: '16px',
            textAlign: 'center', padding: '8px',
            background: 'rgba(255,61,0,0.1)',
            border: '1px solid rgba(255,61,0,0.3)'
          }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? 'rgba(46,204,64,0.1)' : 'rgba(46,204,64,0.2)',
            border: '1px solid #2ECC40',
            color: '#2ECC40',
            fontFamily: 'Orbitron, monospace',
            fontSize: '13px', fontWeight: '700',
            letterSpacing: '3px', cursor: loading ? 'wait' : 'pointer',
            borderRadius: '2px', transition: 'all 0.2s'
          }}
        >
          {loading ? 'VERIFYING...' : 'AUTHENTICATE'}
        </button>

        <div
          onClick={() => navigate('/')}
          style={{
            textAlign: 'center', marginTop: '16px',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px', color: '#2E7D32',
            letterSpacing: '2px', cursor: 'pointer'
          }}
        >
          ← BACK TO PORTAL
        </div>

        <div style={{
          marginTop: '20px', padding: '10px',
          background: 'rgba(46,204,64,0.05)',
          border: '1px solid rgba(46,204,64,0.15)',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '9px', color: '#2E7D32',
          letterSpacing: '1px', textAlign: 'center'
        }}>
          COMMISSIONER: commissioner / arnug2024
        </div>
      </div>
    </div>
  )
}

export default GovLogin