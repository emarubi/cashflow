import { useQuery } from '@apollo/client'
import { GET_EMAIL_TEMPLATES } from '@/graphql/queries/emailTemplates'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  channel: string
}

interface QueryData {
  emailTemplates: EmailTemplate[]
}

export function useEmailTemplates() {
  const { data, loading, error } = useQuery<QueryData>(GET_EMAIL_TEMPLATES)
  return { templates: data?.emailTemplates ?? [], loading, error }
}
