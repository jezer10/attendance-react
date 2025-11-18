import SummaryLine from './SummaryLine'

interface SummaryItem {
  label: string
  value: string
}

interface SummaryCardProps {
  summary: SummaryItem[]
}

const SummaryCard = ({ summary }: SummaryCardProps) => (
  <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
    <div className="space-y-3">
      {summary.map((item) => (
        <SummaryLine key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  </section>
)

export default SummaryCard
