
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase.js'

import IntroAnimation from './pages/IntroAnimation.jsx'
import LoginPage from './pages/LoginPage.jsx'
import GovLogin from './pages/GovLogin.jsx'
import GovDashboard from './pages/GovDashboard.jsx'
import CitizenDashboard from './pages/CitizenDashboard.jsx'
import OfficerDashboard from './pages/OfficerDashboard.jsx'
import AuthCallback from './pages/AuthCallback.jsx'

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    // Restore session on refresh
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const u = {
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
          role: 'citizen'
        }

        localStorage.setItem('arnug_user', JSON.stringify(u))
        localStorage.setItem('arnug_type', 'citizen')

        setUser(u)
        setUserType('citizen')
        setIntroComplete(true)
      } else {

        // Restore government login
        const savedUser = localStorage.getItem('arnug_user')
        const savedType = localStorage.getItem('arnug_type')

        if (savedUser && savedType) {
          setUser(JSON.parse(savedUser))
          setUserType(savedType)
          setIntroComplete(true)
        }
      }

      setLoading(false)
    }

    restoreSession()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {

      if (session?.user) {

        const u = {
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
          role: 'citizen'
        }

        localStorage.setItem('arnug_user', JSON.stringify(u))
        localStorage.setItem('arnug_type', 'citizen')

        setUser(u)
        setUserType('citizen')
        setIntroComplete(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }

  }, [])

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#020A04',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Share Tech Mono, monospace',
        color: '#2ECC40',
        letterSpacing: '3px',
        fontSize: '14px'
      }}>
        INITIALIZING...
      </div>
    )
  }

  if (!introComplete) {
    return <IntroAnimation onComplete={() => setIntroComplete(true)} />
  }

  return (
    <Router>

      <Routes>

        {/* LOGIN PAGE */}
        <Route
          path="/"
          element={
            user ? (
              userType === 'government' ? (
                user.role === 'officer' ? (
                  <Navigate to="/officer-dashboard" />
                ) : (
                  <Navigate to="/gov-dashboard" />
                )
              ) : (
                <Navigate to="/citizen-dashboard" />
              )
            ) : (
              <LoginPage
                setUser={setUser}
                setUserType={setUserType}
              />
            )
          }
        />

        {/* AUTH CALLBACK */}
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        {/* GOV LOGIN */}
        <Route
          path="/gov-login"
          element={
            <GovLogin
              setUser={setUser}
              setUserType={setUserType}
            />
          }
        />

        {/* GOV DASHBOARD */}
        <Route
          path="/gov-dashboard"
          element={
            user &&
            userType === 'government' &&
            user.role === 'commissioner'
              ? (
                <GovDashboard
                  user={user}
                  setUser={setUser}
                />
              )
              : (
                <Navigate to="/" />
              )
          }
        />

        {/* OFFICER DASHBOARD */}
        <Route
          path="/officer-dashboard"
          element={
            user &&
            userType === 'government' &&
            user.role === 'officer'
              ? (
                <OfficerDashboard
                  user={user}
                  setUser={setUser}
                />
              )
              : (
                <Navigate to="/" />
              )
          }
        />

        {/* CITIZEN DASHBOARD */}
        <Route
          path="/citizen-dashboard"
          element={
            user &&
            userType === 'citizen'
              ? (
                <CitizenDashboard
                  user={user}
                  setUser={setUser}
                />
              )
              : (
                <Navigate to="/" />
              )
          }
        />

      </Routes>
    </Router>
  )
}

export default App
