import { useMutation } from '@apollo/client'
import { SEND_TEST_EMAIL } from '@/graphql/mutations/action'

interface SendTestEmailInput {
  to: string
  subject: string
  body: string
}

export function useSendTestEmail() {
  const [mutate, { loading, error }] = useMutation(SEND_TEST_EMAIL)

  const sendTestEmail = (input: SendTestEmailInput) =>
    mutate({ variables: { input } })

  return { sendTestEmail, loading, error }
}
