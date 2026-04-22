export default function Pagination({ page, setPage }) {

  return (
    <div className="flex justify-center mt-10 gap-3 items-center">

      <button
        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1"
        style={{ background: 'var(--chip-bg)', border: '1px solid var(--chip-border)', color: 'var(--chip-text)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Prev
      </button>

      <span className="px-4 py-2 rounded-xl text-sm font-semibold min-w-[80px] text-center"
        style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(249,115,22,0.2)' }}>
        Page {page}
      </span>

      <button
        onClick={() => setPage(prev => prev + 1)}
        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1"
        style={{ background: 'var(--chip-bg)', border: '1px solid var(--chip-border)', color: 'var(--chip-text)' }}
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

    </div>
  )
}