import { useParams } from 'react-router-dom'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Customer #{id}</h1>
    </div>
  )
}
