import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
        navigate('/')
        return
      }

      if (data.session) {
        const user = data.session.user

        localStorage.setItem('arnug_user', JSON.stringify({
          name: user.user_metadata.full_name,
          email: user.email
        }))

        localStorage.setItem('arnug_type', 'citizen')

        navigate('/citizen-dashboard')
      }
    }

    handleAuth()
  }, [])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      Signing in...
    </div>
  )
}