import { useState } from 'react'
import { TEMPLATES } from '../../data/mockData'

const STATUS_META = {
  Active:         { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  Draft:          { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'Under Review': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
}

export default function Templates() {
  const [templates, setTemplates] = useState(TEMPLATES)
  const [yumnaiApproved, setYumnaiApproved] = useState(false)
  const [yumnaiDismissed, setYumnaiDismissed] = useState(false)
  const [uploading, setUploading] = useState(false)

  const yumnaiSuggested = templates.find(t => t.aiSuggested)

  return (
    <div className="space-y-6">
      {/* Yumnai suggestion banner */}
      {yumnaiSuggested && !yumnaiApproved && !yumnaiDismissed && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(143,133,255,0.3)' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--color-primary)' }}>
            <span className="text-white text-[13px]">✦</span>
            <span className="text-[12px] font-bold text-white">Yumnai · Template Suggestion</span>
          </div>
          <div className="p-4" style={{ background: 'rgba(143,133,255,0.04)' }}>
            <p className="text-[13px] text-slate-700 mb-3">
              Based on Finance Request <strong>FR-0046</strong> (Lava Trading, ICT sector, SAR 185,000, 90-day tenure), I suggest applying:
            </p>
            <div className="p-3 rounded-xl border border-indigo-100 bg-white mb-4">
              <div className="font-bold text-slate-800 text-[13px]">{yumnaiSuggested.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{yumnaiSuggested.conditions}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setYumnaiApproved(true)}
                className="flex-1 py-2 rounded-xl text-white font-semibold text-[12px]"
                style={{ background: 'var(--color-primary)' }}>
                Apply to FR-0046 ✓
              </button>
              <button onClick={() => setYumnaiDismissed(true)}
                className="px-4 py-2 rounded-xl font-semibold text-[12px] border border-slate-200 text-slate-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {yumnaiApproved && (
        <div className="rounded-2xl border p-4" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <span className="font-semibold text-emerald-700 text-[13px]">✓ "{yumnaiSuggested?.name}" applied to FR-0046. Agreement generation in progress.</span>
        </div>
      )}

      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-black/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 text-[14px]">Template Library</h3>
          <button onClick={() => setUploading(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-medium"
            style={{ background: 'var(--color-primary)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Template
          </button>
        </div>

        {uploading && (
          <div className="mb-4 border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(143,133,255,0.04)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div className="text-[13px] font-semibold text-slate-700">Drop files here or click to browse</div>
            <div className="text-[11px] text-slate-400">PDF, DOCX supported · Yumnai will auto-classify the template type</div>
            <button className="mt-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-600 hover:border-indigo-300 transition-colors">
              Select File
            </button>
          </div>
        )}

        <div className="space-y-3">
          {templates.map(tpl => {
            const sm = STATUS_META[tpl.status] || STATUS_META.Draft
            return (
              <div key={tpl.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(143,133,255,0.08)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] text-slate-800">{tpl.name}</span>
                    {tpl.aiSuggested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>✦ Yumnai</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">{tpl.type}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">Conditions: {tpl.conditions}</div>
                  <div className="text-[10px] text-slate-300 mt-1">Updated {tpl.lastUpdated} · {tpl.uploadedBy}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                    style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
                    {tpl.status}
                  </span>
                  <button className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    View →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
