import { memo } from 'react'
import { ChevronRight } from 'lucide-react'

export const StaticButton = memo(function StaticButton({ vehicleId, onClick }) {
  return (
    <button
      onClick={() => onClick(vehicleId)}
      className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 group font-medium shadow-lg hover:shadow-red-500/50"
    >
      <span>View Details - {vehicleId}</span>
      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
    </button>
  )
})

