import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL || '/graphql',
  // Envoie les cookies httpOnly (auth_token / refresh_token) avec chaque requête
  credentials: 'include',
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
