import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import IntroAnimation from './pages/IntroAnimation.jsx'
import LoginPage from './pages/LoginPage.jsx'
import GovLogin from './pages/GovLogin.jsx'
import GovDashboard from './pages/GovDashboard.jsx'
import CitizenDashboard from './pages/CitizenDashboard.jsx'

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('arnug_user')
    const savedType = localStorage.getItem('arnug_type')
    if (savedUser && savedType) {
      setUser(JSON.parse(savedUser))
      setUserType(savedType)
      setIntroComplete(true)
    }
  }, [])

  if (!introComplete) {
    return <IntroAnimation onComplete={() => setIntroComplete(true)} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user ? (
            userType === 'government' ?
            <Navigate to="/gov-dashboard" /> :
            <Navigate to="/citizen-dashboard" />
          ) : (
            <LoginPage setUser={setUser} setUserType={setUserType} />
          )
        } />
        <Route path="/gov-login" element={
          <GovLogin setUser={setUser} setUserType={setUserType} />
        } />
        <Route path="/gov-dashboard" element={
          user && userType === 'government' ?
          <GovDashboard user={user} setUser={setUser} /> :
          <Navigate to="/" />
        } />
        <Route path="/citizen-dashboard" element={
          user && userType === 'citizen' ?
          <CitizenDashboard user={user} setUser={setUser} /> :
          <Navigate to="/" />
        } />
      </Routes>
    </Router>
  )
}

export default App