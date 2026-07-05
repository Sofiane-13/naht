import { gql } from '@apollo/client'

export const SEND_EMAIL_CODE = gql`
  mutation SendEmailCode($email: String!) {
    sendEmailCode(email: $email)
  }
`

export const VERIFY_EMAIL_CODE = gql`
  mutation VerifyEmailCode($email: String!, $code: String!) {
    verifyEmailCode(email: $email, code: $code) {
      accessToken
      expiresIn
      email
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      email
      firstName
    }
  }
`
