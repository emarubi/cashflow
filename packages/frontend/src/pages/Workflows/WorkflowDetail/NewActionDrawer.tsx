import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateAction } from '@/hooks/useCreateAction'
import { useSendTestEmail } from '@/hooks/useSendTestEmail'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  workflowId: string
  open: boolean
  onClose: () => void
}

const TRIGGER_OPTIONS = [
  { value: 'after_due',   label: 'action.after_due_date' },
  { value: 'before_due',  label: 'action.before_due_date' },
  { value: 'on_issue',    label: 'action.on_issue_date' },
] as const

const ASSIGNED_DATES_OPTIONS = [
  { value: 'due',   label: 'action.invoice_due_date' },
  { value: 'issue', label: 'action.invoice_issue_date' },
] as const

const DEFAULT_SUBJECT = '{{ Organisation name }} - late payment - Invoice #{{ Invoice number }}'
const DEFAULT_BODY = `Hello,

Unless we are mistaken, we have not yet received your payment for your invoice at {{ Invoice number }} for a total of {{ Invoice amount }}. You can find a summary of your account's state by {{ following this link }}.

We would appreciate a prompt payment upon receipt of this email. If this has already been paid, please ignore this notice.

Best regards,
{{ Sender name }}`

export default function NewActionDrawer({ workflowId, open, onClose }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [assignedDates, setAssignedDates] = useState<'due' | 'issue'>('due')
  const [triggerType, setTriggerType] = useState<'after_due' | 'before_due' | 'on_issue'>('after_due')
  const [delayDays, setDelayDays] = useState(0)
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [senderName, setSenderName] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [testSent, setTestSent] = useState(false)

  const { createAction, loading: saving } = useCreateAction(workflowId)
  const { sendTestEmail, loading: sending } = useSendTestEmail()

  function handleAssignedDatesChange(val: 'due' | 'issue') {
    setAssignedDates(val)
    if (val === 'issue') setTriggerType('on_issue')
    else setTriggerType('after_due')
  }

  async function handleSave() {
    if (!name.trim() || !subject.trim() || !body.trim()) return
    await createAction({
      workflowId,
      delayDays: triggerType === 'before_due' ? -Math.abs(delayDays) : delayDays,
      trigger: triggerType,
      channel: 'email',
      senderName: senderName || undefined,
      isAutomatic,
      templateName: name,
      templateSubject: subject,
      templateBody: body,
    })
    handleClose()
  }

  async function handleSendTest() {
    const to = user?.email ?? ''
    if (!to) return
    await sendTestEmail({ to, subject, body })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  function handleClose() {
    setName('')
    setAssignedDates('due')
    setTriggerType('after_due')
    setDelayDays(0)
    setIsAutomatic(true)
    setSenderName('')
    setCc('')
    setBcc('')
    setSubject(DEFAULT_SUBJECT)
    setBody(DEFAULT_BODY)
    setTestSent(false)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-[480px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{t('action.new_action')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('common.cancel')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <FormRow label={t('action.name')} required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('action.name_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormRow>

          {/* Assigned dates */}
          <FormRow label={t('action.assigned_dates')} required>
            <select
              value={assignedDates}
              onChange={(e) => handleAssignedDatesChange(e.target.value as 'due' | 'issue')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {ASSIGNED_DATES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.label)}</option>
              ))}
            </select>
          </FormRow>

          {/* Trigger */}
          <FormRow label={t('action.trigger')}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={delayDays}
                onChange={(e) => setDelayDays(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={triggerType === 'on_issue'}
                className="w-16 border border-gray-300 rounded-md px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <span className="text-sm text-gray-500">{t('action.days')}</span>
              <select
                value={triggerType}
                onChange={(e) => {
                  const val = e.target.value as typeof triggerType
                  setTriggerType(val)
                  if (val === 'on_issue') setAssignedDates('issue')
                  else setAssignedDates('due')
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {TRIGGER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(o.label)}</option>
                ))}
              </select>
            </div>
          </FormRow>

          {/* Type */}
          <FormRow label={t('action.type')}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutomatic}
                onChange={(e) => setIsAutomatic(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('action.send_automatically')}</span>
            </label>
          </FormRow>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* From */}
          <FormRow label={t('action.from')}>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={t('action.from_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormRow>

          {/* Recipients */}
          <FormRow label={t('action.recipients')}>
            <div className="flex flex-wrap items-center gap-1 min-h-[38px] border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50">
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {t('action.main_contact')}
                <span className="text-blue-400 ml-1 cursor-default">×</span>
              </span>
            </div>
          </FormRow>

          {/* CC */}
          <FormRow label="CC">
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder={t('action.cc_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormRow>

          {/* BCC */}
          <FormRow label="BCC">
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder={t('action.bcc_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </FormRow>

          {/* Subject */}
          <FormRow label={t('action.subject')}>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                title={t('action.insert_variable')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
              >
                {'{{ }}'}
              </button>
            </div>
          </FormRow>

          {/* Message */}
          <FormRow label={t('action.message')}>
            <div className="relative">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <button
                type="button"
                title={t('action.insert_variable')}
                className="absolute right-2 top-2 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
              >
                {'{{ }}'}
              </button>
            </div>
          </FormRow>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={handleSendTest}
            disabled={sending || !subject.trim() || !body.trim()}
            className="text-sm text-blue-600 font-medium hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {testSent
              ? t('action.test_sent')
              : sending
                ? t('action.sending_test')
                : t('action.send_test_email')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </>
  )
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-blue-500 ml-1">●</span>}
      </label>
      {children}
    </div>
  )
}
