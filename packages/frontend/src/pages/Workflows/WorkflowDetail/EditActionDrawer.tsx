import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WorkflowAction } from '@/hooks/useWorkflow'
import { useUpdateAction } from '@/hooks/useUpdateAction'
import { useDeleteAction } from '@/hooks/useDeleteAction'
import { useSendTestEmail } from '@/hooks/useSendTestEmail'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  workflowId: string
  action: WorkflowAction
  onClose: () => void
}

const TRIGGER_OPTIONS = [
  { value: 'after_due',  label: 'action.after_due_date' },
  { value: 'before_due', label: 'action.before_due_date' },
  { value: 'on_issue',   label: 'action.on_issue_date' },
] as const

const CHANNEL_OPTIONS = [
  { value: 'email',  label: 'action.channel_email' },
  { value: 'call',   label: 'action.channel_call' },
  { value: 'letter', label: 'action.channel_letter' },
] as const

export default function EditActionDrawer({ workflowId, action, onClose }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [name, setName]               = useState(action.template?.name ?? action.senderName ?? '')
  const [triggerType, setTriggerType] = useState(action.trigger)
  const [delayDays, setDelayDays]     = useState(Math.abs(action.delayDays))
  const [channel, setChannel]         = useState(action.channel)
  const [isAutomatic, setIsAutomatic] = useState(action.isAutomatic)
  const [senderName, setSenderName]   = useState(action.senderName ?? '')
  const [recipients, setRecipients]   = useState('')
  const [cc, setCc]                   = useState('')
  const [bcc, setBcc]                 = useState('')
  const [subject, setSubject]         = useState(action.template?.subject ?? '')
  const [body, setBody]               = useState(action.template?.body ?? '')

  const [testModalOpen, setTestModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Re-sync if the parent swaps the action (e.g. clicking a different row while drawer is open)
  useEffect(() => {
    setName(action.template?.name ?? action.senderName ?? '')
    setTriggerType(action.trigger)
    setDelayDays(Math.abs(action.delayDays))
    setChannel(action.channel)
    setIsAutomatic(action.isAutomatic)
    setSenderName(action.senderName ?? '')
    setSubject(action.template?.subject ?? '')
    setBody(action.template?.body ?? '')
  }, [action.id])  // eslint-disable-line react-hooks/exhaustive-deps

  const { updateAction, loading: saving }   = useUpdateAction(workflowId)
  const { deleteAction, loading: deleting } = useDeleteAction(workflowId)
  const { sendTestEmail, loading: sending } = useSendTestEmail()

  async function handleSave() {
    await updateAction(action.id, {
      delayDays: triggerType === 'before_due' ? -Math.abs(delayDays) : delayDays,
      trigger: triggerType,
      channel,
      senderName: senderName || undefined,
      isAutomatic,
      templateName: name || undefined,
      templateSubject: subject || undefined,
      templateBody: body || undefined,
    })
    onClose()
  }

  async function handleDelete() {
    await deleteAction(action.id)
    onClose()
  }

  async function handleDuplicate() {
    // Duplicate = create a new action with the same data (step_order auto-increments)
    // This uses createAction indirectly — for now just close and let the user re-create.
    // Full duplicate support can be added when a duplicateAction mutation is available.
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-[480px] bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{t('action.edit_action')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <IconX />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <FormRow label={t('action.name')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('action.name_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
                onChange={(e) => setTriggerType(e.target.value as typeof triggerType)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TRIGGER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(o.label)}</option>
                ))}
              </select>
            </div>
          </FormRow>

          {/* Type / Channel */}
          <FormRow label={t('action.type')}>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.label)}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutomatic}
                onChange={(e) => setIsAutomatic(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('action.send_automatically')}</span>
            </label>
          </FormRow>

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
            <input
              type="email"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder={t('action.recipients_placeholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* Footer — Delete | Send test | Duplicate | Save */}
        <div className="flex items-center justify-between px-6 py-4 mb-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
          >
            {t('common.delete')}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTestModalOpen(true)}
              disabled={!subject.trim() || !body.trim()}
              className="text-sm text-blue-600 font-medium hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('action.send_test_email')}
            </button>
            <button
              onClick={handleDuplicate}
              className="border border-gray-300 text-sm text-gray-700 font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('action.duplicate')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </div>

      {/* Test email modal */}
      {testModalOpen && (
        <TestEmailModal
          userEmail={user?.email ?? ''}
          loading={sending}
          onCancel={() => setTestModalOpen(false)}
          onConfirm={async () => {
            await sendTestEmail({ to: user?.email ?? '', subject, body })
            setTestModalOpen(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <ConfirmDeleteModal
          loading={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}

// ─── Test email modal ─────────────────────────────────────────────────────────

function TestEmailModal({ userEmail, loading, onCancel, onConfirm }: {
  userEmail: string
  loading: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [customer, setCustomer] = useState('')
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{t('action.send_test_email')}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><IconX /></button>
        </div>
        <p className="text-sm text-gray-600">{t('action.test_modal_desc', { email: userEmail })}</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-gray-700">{t('action.test_modal_from')}</label>
          <div className="relative">
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500"
            >
              <option value="">{t('action.test_modal_select_customer')}</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 font-medium">{t('common.cancel')}</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('action.sending_test') : t('action.send_test_email')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function ConfirmDeleteModal({ loading, onCancel, onConfirm }: {
  loading: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-gray-900">{t('action.delete_confirm_title')}</h3>
        <p className="text-sm text-gray-600">{t('action.delete_confirm_body')}</p>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 font-medium">{t('common.cancel')}</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-blue-500 ml-1">●</span>}
      </label>
      {children}
    </div>
  )
}
