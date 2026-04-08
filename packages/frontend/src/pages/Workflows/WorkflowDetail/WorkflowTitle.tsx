import { useState, useRef, useEffect } from 'react'
import { useUpdateWorkflow } from '@/hooks/useUpdateWorkflow'

interface WorkflowTitleProps {
  workflowId: string
  name: string
}

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export default function WorkflowTitle({ workflowId, name }: WorkflowTitleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateWorkflow } = useUpdateWorkflow(workflowId)

  useEffect(() => { setValue(name) }, [name])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function handleSave() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) {
      void updateWorkflow({ name: trimmed })
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setValue(name); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent min-w-[240px]"
      />
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-xl font-semibold text-gray-900">{name}</h1>
      <button
        onClick={() => setEditing(true)}
        className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <IconPencil />
      </button>
    </div>
  )
}
