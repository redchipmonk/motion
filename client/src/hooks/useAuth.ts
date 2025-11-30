import { useEffect, useState } from 'react'

interface User {
  name: string
  email: string
  picture: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/me', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const loginWithGoogle = () => {
    window.location.href = '/auth/google' 
  }

  const logout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }

  return { user, loading, loginWithGoogle, logout }
}