import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import client from '@/graphql/client'
import { UIProvider } from '@/contexts/UIContext'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <UIProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </UIProvider>
    </ApolloProvider>
  </React.StrictMode>
)
