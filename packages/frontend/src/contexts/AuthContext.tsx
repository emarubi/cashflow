import React, { createContext, useContext, useState, useCallback } from 'react'
import { gql } from '@apollo/client'
import client from '@/graphql/client'

interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
}

interface Company {
  id: string
  slug: string
}

interface JwtPayload {
  userId: string
  companyId: string
  companySlug: string
  role: string
  iat: number
  exp: number
}

interface AuthContextValue {
  user: User | null
  company: Company | null
  token: string | null
  login: (email: string, password: string, companySlug: string) => Promise<void>
  logout: () => void
}

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!, $companySlug: String!) {
    login(email: $email, password: $password, companySlug: $companySlug) {
      accessToken
      user {
        id
        name
        email
        role
        companyId
      }
    }
  }
`

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as JwtPayload
  } catch {
    return null
  }
}

function readStoredAuth(): { user: User | null; company: Company | null; token: string | null } {
  try {
    const token = localStorage.getItem('cashflow_token')
    const user = localStorage.getItem('cashflow_user')
    const company = localStorage.getItem('cashflow_company')
    return {
      token,
      user: user ? (JSON.parse(user) as User) : null,
      company: company ? (JSON.parse(company) as Company) : null,
    }
  } catch {
    return { token: null, user: null, company: null }
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readStoredAuth()
  const [token, setToken] = useState<string | null>(stored.token)
  const [user, setUser] = useState<User | null>(stored.user)
  const [company, setCompany] = useState<Company | null>(stored.company)

  const login = useCallback(async (email: string, password: string, companySlug: string) => {
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { email, password, companySlug },
    })

    const accessToken = data.login.accessToken as string
    const userData = data.login.user as User
    const jwt = decodeJwt(accessToken)
    const companyData: Company = {
      id: userData.companyId,
      slug: jwt?.companySlug ?? companySlug,
    }

    localStorage.setItem('cashflow_token', accessToken)
    localStorage.setItem('cashflow_user', JSON.stringify(userData))
    localStorage.setItem('cashflow_company', JSON.stringify(companyData))

    setToken(accessToken)
    setUser(userData)
    setCompany(companyData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cashflow_token')
    localStorage.removeItem('cashflow_user')
    localStorage.removeItem('cashflow_company')
    setToken(null)
    setUser(null)
    setCompany(null)
    client.clearStore().catch(() => null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, company, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
