import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import type { CurrentUser } from '@naht/shared'
import { GET_CURRENT_USER, LOGOUT } from '../graphql/auth'

interface CurrentUserQuery {
  getCurrentUser: CurrentUser | null
}

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  refetchUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch } = useQuery<CurrentUserQuery>(
    GET_CURRENT_USER,
    { fetchPolicy: 'network-only' },
  )
  const [logoutMutation] = useMutation(LOGOUT)

  const refetchUser = useCallback(async () => {
    await refetch()
  }, [refetch])

  const logout = useCallback(async () => {
    await logoutMutation()
    await refetch()
  }, [logoutMutation, refetch])

  return (
    <AuthContext.Provider
      value={{
        user: data?.getCurrentUser ?? null,
        loading,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  }
  return ctx
}
