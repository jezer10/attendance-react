const SummaryLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 text-sm text-slate-600">
    <span className="font-medium text-slate-500">{label}</span>
    <span className="text-right text-slate-800">{value}</span>
  </div>
)

export default SummaryLine
