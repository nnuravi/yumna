import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { DASHBOARD_STATS } from '../../data/mockData'

// ── Utility ───────────────────────────────────────────────────────────────────

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return
  const exportRows = rows.map(r => {
    const out = {}
    Object.entries(r).forEach(([k, v]) => {
      if (typeof v !== 'object') out[k] = v
    })
    return out
  })
  const headers = Object.keys(exportRows[0])
  const lines = [
    headers.join(','),
    ...exportRows.map(row =>
      headers.map(h => {
        const val = row[h] === undefined ? '' : String(row[h])
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
      }).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function fmtNum(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(v)
}

// ── AI Summary generator ──────────────────────────────────────────────────────

function generateAISummary(item, type) {
  if (type === 'credit') {
    const status = item.Status
    const score = item['Simah Score']
    const utilisation = item.creditUtilisation
    const manual = item.manualReview
    const reviewer = item.reviewedBy
    const note = item.reviewNote
    const limit = (item['Limit (SAR)'] || 0).toLocaleString('en-SA')
    const creditType = item.Type

    if (status === 'Approve') {
      if (manual && note) {
        return {
          headline: `Manually approved by ${reviewer}`,
          body: `This application was reviewed and approved by ${reviewer} following a detailed assessment. ${note} The applicant's SIMAH score of ${score} exceeds the minimum threshold, and all submitted documentation has been verified. Credit limit of SAR ${limit} has been activated under the ${creditType} classification.`,
          tone: 'positive',
        }
      }
      return {
        headline: 'Automatically approved — all conditions met',
        body: `The application passed all automated scoring checks. SIMAH score of ${score} meets or exceeds the minimum threshold of 600. Credit utilisation of ${utilisation} is within the acceptable range. All KYC documents were verified during onboarding. A credit limit of SAR ${limit} has been assigned under ${creditType} classification.`,
        tone: 'positive',
      }
    }

    if (status === 'Reject') {
      if (manual && note) {
        return {
          headline: `Manually declined by ${reviewer}`,
          body: `This application was manually reviewed and declined by ${reviewer}. Reviewer note: "${note}" Automated checks also flagged the following: SIMAH score of ${score}${score < 600 ? ' falls below the minimum threshold of 600' : ' was within range, but other conditions were not met'}. Credit utilisation of ${utilisation}${parseFloat(utilisation) > 75 ? ' exceeds the 75% ceiling' : ''}. The applicant may reapply once the flagged conditions are resolved.`,
          tone: 'critical',
        }
      }
      const reasons = []
      if (score < 600) reasons.push(`SIMAH score of ${score} is below the minimum threshold of 600`)
      if (parseFloat(utilisation) > 75) reasons.push(`credit utilisation of ${utilisation} exceeds the maximum allowed 75%`)
      return {
        headline: 'Automatically declined — scoring conditions not met',
        body: `This application was declined by the automated scoring engine. Triggered condition${reasons.length > 1 ? 's' : ''}: ${reasons.join('; ')}. The requested SAR ${limit} credit limit under ${creditType} classification cannot be approved at this time. The applicant should address the flagged items and reapply after a minimum of 90 days.`,
        tone: 'critical',
      }
    }

    if (status === 'Pending') {
      if (manual && note) {
        return {
          headline: `Under manual review by ${reviewer}`,
          body: `This application is currently being reviewed by ${reviewer}. ${note} SIMAH score of ${score} is within acceptable range. Outstanding items are being resolved before a final credit decision can be issued.`,
          tone: 'warning',
        }
      }
      const pendingReason = creditType === 'Full Credit'
        ? 'Full Credit applications require a live SIMAH bureau pull and a full document verification pass before the credit limit can be calculated.'
        : 'Sales Ledger applications require validation of at least 3 months of trading history with the associated merchant before the limit can be confirmed.'
      return {
        headline: 'Pending review — additional verification required',
        body: `${pendingReason} SIMAH score of ${score} is on record. The application has been queued for the credit scoring team. Expected turnaround: 4–8 business hours.`,
        tone: 'warning',
      }
    }
  }

  if (type === 'collection') {
    const status = item.Status
    const days = item['Days Overdue'] || 0
    const amount = (item['Amount (SAR)'] || 0).toLocaleString('en-SA')
    const lastContact = item.lastContactDate
    const note = item.collectionNote
    const instNum = item.installmentNumber
    const totalInst = item.totalInstallments

    if (status === 'Paid') {
      return {
        headline: 'Installment fully settled — no action required',
        body: `Installment ${instNum} of ${totalInst} (SAR ${amount}) was received and marked as settled. ${note} The account remains in good standing. Credit limit has been restored proportionally.`,
        tone: 'positive',
      }
    }
    if (status === 'Due Soon') {
      return {
        headline: 'Payment approaching — pre-emptive contact initiated',
        body: `This installment (SAR ${amount}) is due within 7 days. ${note} Installment ${instNum} of ${totalInst}. No action is required unless payment is not received by the due date. An automatic reminder has been sent to the buyer.`,
        tone: 'warning',
      }
    }
    if (status === 'Overdue') {
      const severity = days > 25 ? 'critical' : 'warning'
      return {
        headline: `Payment ${days} days overdue — immediate action required`,
        body: `SAR ${amount} (installment ${instNum} of ${totalInst}) has not been received. Last contact with buyer: ${lastContact}. Collections note: ${note} ${days > 25 ? 'This account is approaching the escalation threshold. A legal notice may be required if payment is not received within 5 business days.' : 'The collections team is actively following up.'}`,
        tone: severity,
      }
    }
  }

  if (type === 'risk') {
    const status = item.Status
    const score = item['Risk Score']
    const utilisation = item['Credit Utilisation']
    const issue = item.Issue
    const reviewer = item.lastReviewedBy
    const escalationNote = item.escalationNote
    const nextReview = item.nextReviewDate

    if (status === 'Clear') {
      return {
        headline: 'No risk signals detected — account in good standing',
        body: `Risk score of ${score} is well within the Low tier threshold (≤ 30). Credit utilisation of ${utilisation} is healthy. No payment delays, fraud signals, or AML flags have been recorded. Next scheduled review: ${nextReview}.`,
        tone: 'positive',
      }
    }
    if (status === 'Monitoring') {
      return {
        headline: `Active monitoring — ${issue}`,
        body: `This account has been flagged for periodic monitoring. Risk score: ${score} (${score >= 61 ? 'High' : 'Medium'} tier). Current credit utilisation: ${utilisation}. Issue identified: ${issue}. ${reviewer !== 'System' ? `Last reviewed by ${reviewer}.` : 'Automated monitoring active.'} Next scheduled review: ${nextReview}.`,
        tone: 'warning',
      }
    }
    if (status === 'Alert Sent') {
      return {
        headline: 'Automated alert triggered — credit team notified',
        body: `Risk score of ${score} and credit utilisation of ${utilisation} triggered an automated alert. ${escalationNote} New finance requests for this buyer have been paused pending utilisation reduction. Reviewed by ${reviewer}. Next review: ${nextReview}.`,
        tone: 'warning',
      }
    }
    if (status === 'Escalated') {
      return {
        headline: 'Escalated to senior review — high-risk account',
        body: `Risk score of ${score} has reached the escalation threshold. ${escalationNote} Credit utilisation at ${utilisation}. Reviewed by ${reviewer}. This account requires immediate attention. Next mandatory review: ${nextReview}.`,
        tone: 'critical',
      }
    }
  }

  if (type === 'sales') {
    return {
      headline: 'Finance request disbursed successfully',
      body: `SAR ${(item['Amount (SAR)'] || 0).toLocaleString('en-SA')} was disbursed to ${item.Seller} on ${item['Disbursement Date']}. The order covers ${item.Installments} installment${item.Installments > 1 ? 's' : ''} across the ${item.Sector} sector. Buyer: ${item.Buyer}. All delivery confirmations and MDR consents were obtained prior to disbursement.`,
      tone: 'positive',
    }
  }

  if (type === 'team') {
    const tatPct = item.tatPct
    const tone = tatPct > 100 ? 'critical' : tatPct > 85 ? 'warning' : 'positive'
    const statusText = tatPct > 100
      ? `The team is currently over their TAT target (${tatPct}% of target used). Workload should be reviewed and resources redistributed if necessary.`
      : tatPct > 85
      ? `The team is approaching their TAT ceiling (${tatPct}% of target). Current queue of ${item.queueCount} items should be prioritised.`
      : `The team is performing well within their TAT target (${tatPct}% of target consumed). Queue of ${item.queueCount} items is manageable.`
    return {
      headline: `${item.team} — ${item.status === 'on-track' ? 'On Track' : item.status === 'over' ? 'Over TAT Target' : 'Approaching Limit'}`,
      body: `${statusText} Key metric: ${item.keyMetric} (${item.keyMetricLabel}). Average TAT is ${item.avgTAT} against a target of ${item.targetTAT}. Team lead: ${item.member}.`,
      tone,
    }
  }

  return { headline: 'No summary available', body: 'No AI analysis available for this item.', tone: 'neutral' }
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

const TONE_STYLES = {
  positive: { border: '#e5e5e5', bg: '#f5f5f5', text: '#262626' },
  warning:  { border: '#d4d4d4', bg: '#f0f0f0', text: '#525252' },
  critical: { border: '#d4d4d4', bg: '#f0f0f0', text: '#525252' },
  neutral:  { border: '#e5e5e5', bg: '#fafafa', text: '#404040' },
}

function keyFactsForType(item, type) {
  if (type === 'credit') return [
    { label: 'Application ID', value: item.ID },
    { label: 'Type', value: item.Type },
    { label: 'Requested Limit', value: `SAR ${(item['Limit (SAR)'] || 0).toLocaleString('en-SA')}` },
    { label: 'SIMAH Score', value: item['Simah Score'] },
    { label: 'Credit Utilisation', value: item.creditUtilisation },
    { label: 'Sector', value: item.sector },
    { label: 'Submitted', value: item.Date },
    { label: 'Reviewed by', value: item.reviewedBy },
  ]
  if (type === 'collection') return [
    { label: 'Invoice ID', value: item.ID },
    { label: 'Buyer', value: item.Buyer },
    { label: 'Seller', value: item.Seller },
    { label: 'Amount', value: `SAR ${(item['Amount (SAR)'] || 0).toLocaleString('en-SA')}` },
    { label: 'Due Date', value: item['Due Date'] },
    { label: 'Days Overdue', value: item['Days Overdue'] || 0 },
    { label: 'Installment', value: `${item.installmentNumber} of ${item.totalInstallments}` },
    { label: 'Last Contact', value: item.lastContactDate },
  ]
  if (type === 'risk') return [
    { label: 'Buyer', value: item.Buyer },
    { label: 'Risk Score', value: item['Risk Score'] },
    { label: 'Tier', value: item.Tier },
    { label: 'Credit Utilisation', value: item['Credit Utilisation'] },
    { label: 'Issue', value: item.Issue },
    { label: 'Reviewed by', value: item.lastReviewedBy },
    { label: 'Last Reviewed', value: item['Last Reviewed'] },
    { label: 'Next Review', value: item.nextReviewDate },
  ]
  if (type === 'sales') return [
    { label: 'Order ID', value: item.ID },
    { label: 'Buyer', value: item.Buyer },
    { label: 'Seller', value: item.Seller },
    { label: 'Amount', value: `SAR ${(item['Amount (SAR)'] || 0).toLocaleString('en-SA')}` },
    { label: 'Disbursement Date', value: item['Disbursement Date'] },
    { label: 'Sector', value: item.Sector },
    { label: 'Installments', value: item.Installments },
  ]
  if (type === 'team') return [
    { label: 'Team', value: item.team },
    { label: 'Team Lead', value: item.member },
    { label: 'Avg TAT', value: item.avgTAT },
    { label: 'Target TAT', value: item.targetTAT },
    { label: 'TAT vs Target', value: `${item.tatPct}%` },
    { label: 'Queue Size', value: item.queueCount },
    { label: item.keyMetricLabel, value: item.keyMetric },
    { label: 'Status', value: item.status },
  ]
  return Object.entries(item).filter(([k]) => typeof item[k] !== 'object').map(([k, v]) => ({ label: k, value: v }))
}

function timelineForType(item, type) {
  if (type === 'credit') {
    const events = [
      { icon: '📋', text: `Application ${item.ID} submitted by ${item.Client}`, time: item.Date, actor: 'Applicant' },
      { icon: '🤖', text: `Automated scoring completed — SIMAH ${item['Simah Score']}`, time: `${item.Date} +30min`, actor: 'System' },
    ]
    if (item.Status === 'Approve') {
      events.push({ icon: '✅', text: `Credit limit of SAR ${(item['Limit (SAR)']).toLocaleString('en-SA')} approved`, time: `${item.Date} +${item.manualReview ? '4hrs' : '1hr'}`, actor: item.reviewedBy })
      events.push({ icon: '📩', text: 'Approval notification sent to applicant', time: `${item.Date} +4.5hrs`, actor: 'System' })
    } else if (item.Status === 'Reject') {
      events.push({ icon: '❌', text: 'Application declined — notification sent to applicant', time: `${item.Date} +${item.manualReview ? '6hrs' : '1hr'}`, actor: item.reviewedBy })
    } else {
      events.push({ icon: '⏳', text: 'Forwarded to credit scoring team for manual review', time: `${item.Date} +1hr`, actor: 'Sara Al-Ghamdi' })
      events.push({ icon: '🔍', text: item.reviewNote || 'Under review — awaiting additional documentation', time: `${item.Date} +2hrs`, actor: item.reviewedBy })
    }
    return events
  }
  if (type === 'collection') {
    const events = [
      { icon: '📦', text: `Invoice ${item.ID} issued — SAR ${(item['Amount (SAR)']).toLocaleString('en-SA')}`, time: 'Invoice date', actor: item.Seller },
      { icon: '📅', text: `Payment due: ${item['Due Date']}`, time: 'Scheduled', actor: 'System' },
    ]
    if (item.Status === 'Overdue') {
      events.push({ icon: '⚠️', text: `Payment missed — overdue by ${item['Days Overdue']} days`, time: item['Due Date'], actor: 'System' })
      events.push({ icon: '📞', text: `Collections team contacted buyer. ${item.collectionNote}`, time: item.lastContactDate, actor: 'Omar Al-Mutairi' })
    } else if (item.Status === 'Paid') {
      events.push({ icon: '✅', text: `Payment of SAR ${(item['Amount (SAR)']).toLocaleString('en-SA')} received`, time: item['Due Date'], actor: item.Buyer })
      events.push({ icon: '🔓', text: 'Credit limit restored. Account in good standing.', time: `${item['Due Date']} +1hr`, actor: 'System' })
    } else {
      events.push({ icon: '🔔', text: 'Pre-payment reminder sent to buyer', time: 'Today', actor: 'System' })
    }
    return events
  }
  if (type === 'risk') {
    const events = [
      { icon: '🤖', text: `Automated risk score computed: ${item['Risk Score']} (${item.Tier} tier)`, time: item['Last Reviewed'], actor: 'System' },
    ]
    if (item.Status === 'Alert Sent') {
      events.push({ icon: '🚨', text: `Automated alert triggered — credit utilisation at ${item['Credit Utilisation']}`, time: item['Last Reviewed'], actor: 'System' })
      events.push({ icon: '📩', text: 'Alert sent to credit team. New finance requests paused.', time: item['Last Reviewed'], actor: item.lastReviewedBy })
    } else if (item.Status === 'Escalated') {
      events.push({ icon: '⬆️', text: `Escalated to senior review — ${item.escalationNote}`, time: item['Last Reviewed'], actor: item.lastReviewedBy })
      events.push({ icon: '🔒', text: 'Account frozen. No new credit issuance permitted.', time: item['Last Reviewed'], actor: 'System' })
    } else if (item.Status === 'Monitoring') {
      events.push({ icon: '👁️', text: `Flagged for monitoring — ${item.Issue}`, time: item['Last Reviewed'], actor: item.lastReviewedBy })
      events.push({ icon: '📅', text: `Next review scheduled: ${item.nextReviewDate}`, time: '-', actor: 'System' })
    } else {
      events.push({ icon: '✅', text: 'No risk signals. Account cleared for continued credit.', time: item['Last Reviewed'], actor: 'System' })
    }
    return events
  }
  if (type === 'sales') {
    return [
      { icon: '📋', text: `Finance request ${item.ID} submitted`, time: item['Disbursement Date'], actor: item.Seller },
      { icon: '✅', text: 'Risk assessment passed — application approved', time: `${item['Disbursement Date']} +2hrs`, actor: 'Risk Team' },
      { icon: '📦', text: 'Buyer confirmed delivery and signed MDR consent', time: `${item['Disbursement Date']} +3hrs`, actor: item.Buyer },
      { icon: '💸', text: `SAR ${(item['Amount (SAR)'] * 0.975).toLocaleString('en-SA', { maximumFractionDigits: 0 })} disbursed to ${item.Seller} IBAN`, time: item['Disbursement Date'], actor: 'System' },
    ]
  }
  if (type === 'team') {
    return [
      { icon: '📊', text: `TAT snapshot recorded: ${item.avgTAT} avg (target ${item.targetTAT})`, time: 'Today', actor: 'System' },
      { icon: '👤', text: `Queue review by ${item.member} — ${item.queueCount} items active`, time: 'Today', actor: item.member },
      { icon: '📈', text: `${item.keyMetricLabel}: ${item.keyMetric}`, time: 'Today', actor: item.team },
    ]
  }
  return []
}

function DetailModal({ item, type, onClose }) {
  if (!item) return null
  const summary = generateAISummary(item, type)
  const toneStyle = TONE_STYLES[summary.tone]
  const keyFacts = keyFactsForType(item, type)
  const timeline = timelineForType(item, type)

  const entityName = item.Client || item.Buyer || item.ID || item.team || 'Detail'
  const entityId = item.ID || item.team || ''

  const statusVal = item.Status || item.status || ''
  const statusColor = (v) => {
    const s = String(v).toLowerCase()
    if (['approve', 'paid', 'clear', 'on-track'].includes(s)) return { bg: '#262626', text: 'white' }
    if (['reject', 'escalated', 'over'].includes(s)) return { bg: '#737373', text: 'white' }
    if (['pending', 'overdue', 'alert sent', 'monitoring', 'at-risk', 'due soon'].includes(s)) return { bg: '#525252', text: 'white' }
    return { bg: '#a3a3a3', text: 'white' }
  }
  const sc = statusColor(statusVal)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800 text-[15px] leading-tight">{entityName}</div>
            {entityId && entityId !== entityName && (
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{entityId}</div>
            )}
          </div>
          {statusVal && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold shrink-0" style={{ background: sc.bg, color: sc.text }}>
              {statusVal}
            </span>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Key facts */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Key Details</div>
            <div className="grid grid-cols-2 gap-2">
              {keyFacts.map((f, i) => (
                <div key={i} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="text-[10px] font-medium text-slate-400 mb-0.5">{f.label}</div>
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">AI Analysis</div>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: toneStyle.border + '40' }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: toneStyle.border, borderColor: toneStyle.border }}>
                <span className="text-[13px]">✦</span>
                <span className="text-[12px] font-bold text-white tracking-wide">Yumna AI · Decision Analysis</span>
              </div>
              <div className="px-4 py-4" style={{ background: toneStyle.bg, borderLeft: `3px solid ${toneStyle.border}` }}>
                <div className="font-semibold text-[13px] mb-2" style={{ color: toneStyle.text }}>{summary.headline}</div>
                <p className="text-[12px] leading-relaxed" style={{ color: toneStyle.text + 'cc' }}>{summary.body}</p>
                <div className="mt-3 pt-3 border-t text-[10px]" style={{ borderColor: toneStyle.border + '30', color: toneStyle.text + '80' }}>
                  Generated by Yumna AI · Based on SAMA-aligned scoring rules and manual review records
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Activity Timeline</div>
              <div className="relative">
                <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-100 rounded-full" />
                {timeline.map((event, i) => (
                  <div key={i} className="relative flex gap-3 mb-4 pl-9">
                    <div className="absolute left-0 w-7 h-7 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[13px] z-10">
                      {event.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate-700 leading-snug">{event.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{event.time} · {event.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={() => downloadCSV(entityId || entityName, [item])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export this record
          </button>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chart primitives ──────────────────────────────────────────────────────────

function DonutChart({ segments, size = 120 }) {
  const r = (size - 16) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  const arcs = segments.map(seg => {
    const dash = (seg.pct / 100) * circumference
    const arc = { ...seg, dash, gap: circumference - dash, offset }
    offset += dash
    return arc
  })
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth="14"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px] text-slate-500 truncate">{seg.label}</span>
            <span className="text-[11px] font-semibold text-slate-700 ml-auto">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.pct, 0)
  let cumAngle = -90
  const cx = size / 2, cy = size / 2, r = size / 2 - 4
  const slices = segments.map(seg => {
    const angle = (seg.pct / total) * 360
    const start = cumAngle
    cumAngle += angle
    const end = cumAngle
    const toRad = a => (a * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(start)), y1 = cy + r * Math.sin(toRad(start))
    const x2 = cx + r * Math.cos(toRad(end)), y2 = cy + r * Math.sin(toRad(end))
    const mid = start + angle / 2
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`,
      lx: cx + r * 0.65 * Math.cos(toRad(mid)), ly: cy + r * 0.65 * Math.sin(toRad(mid)), angle }
  })
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1.5" />)}
      {slices.map((s, i) => s.angle > 8 && (
        <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 9, fontWeight: 700, fill: 'white' }}>{s.pct}%</text>
      ))}
    </svg>
  )
}

function GaugeChart({ value, max, size = 160 }) {
  const r = size / 2 - 14, cx = size / 2, cy = size / 2 + 10
  const circ = Math.PI * r
  const filled = Math.min(value / max, 1) * circ
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="16"
          strokeDasharray={`${circ} ${circ}`}
          style={{ transform: `rotate(180deg)`, transformOrigin: `${cx}px ${cy}px` }} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke='#404040' strokeWidth="16"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transform: `rotate(180deg)`, transformOrigin: `${cx}px ${cy}px` }} strokeLinecap="round" />
        <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 18, fontWeight: 700, fill: '#171717' }}>{fmtNum(value)}</text>
        <text x={8} y={cy + 20} style={{ fontSize: 9, fill: '#a3a3a3' }}>0</text>
        <text x={size - 8} y={cy + 20} textAnchor="end" style={{ fontSize: 9, fill: '#a3a3a3' }}>{fmtNum(max)}</text>
      </svg>
    </div>
  )
}

function VerticalBarChart({ data, height = 120, color = '#93c5fd' }) {
  const max = Math.max(...data.map(d => d.amount || d.records || d.value || 0))
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const val = d.amount || d.records || d.value || 0
        const barH = max > 0 ? (val / max) * (height - 24) : 0
        return (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <div className="text-[8px] text-slate-400 mb-0.5 tabular-nums">{fmtNum(val)}</div>
            <div className="w-full rounded-t-sm" style={{ height: barH, background: color, minHeight: 2 }} />
            <div className="text-[8px] text-slate-400 mt-1 truncate w-full text-center">{d.name || d.month || d.count}</div>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBarChart({ data, color = '#93c5fd' }) {
  const max = Math.max(...data.map(d => d.records || d.amount || 0))
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = d.records || d.amount || 0
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="text-[11px] text-slate-500 w-5 text-right shrink-0">{d.count || d.name}</div>
            <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden">
              <div className="h-full rounded-sm" style={{ width: `${max > 0 ? (val / max) * 100 : 0}%`, background: color }} />
            </div>
            <div className="text-[11px] font-semibold text-slate-700 w-6 shrink-0">{val}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Drill-down drawer (bulk data view) ────────────────────────────────────────

function DrillDownDrawer({ target, onClose, onRowDetail }) {
  if (!target) return null
  const { title, rows, filename, rowType } = target
  const headers = rows.length > 0 ? Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object' && !['reviewNote', 'manualReview', 'creditUtilisation', 'sector', 'reviewedBy', 'installmentNumber', 'totalInstallments', 'lastContactDate', 'collectionNote', 'lastReviewedBy', 'escalationNote', 'nextReviewDate'].includes(k)) : []

  const statusColor = v => {
    if (v === 'Overdue' || v === 'Reject' || v === 'Escalated') return '#737373'
    if (v === 'Pending' || v === 'Alert Sent' || v === 'Monitoring' || v === 'Due Soon') return '#525252'
    if (v === 'Approve' || v === 'Paid' || v === 'Clear') return '#262626'
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[720px] bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-[15px]">{title}</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => downloadCSV(filename || title, rows)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-700 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download CSV
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-2 border-b border-slate-50 text-[11px] text-slate-400">
          Click any row to view details and AI analysis
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                {headers.map(h => (
                  <th key={h} className="text-start px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}
                  className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                  onClick={() => onRowDetail && onRowDetail(row, rowType)}>
                  {headers.map(h => {
                    const val = row[h]
                    const color = typeof val === 'string' ? statusColor(val) : null
                    return (
                      <td key={h} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                        {color ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: color }}>{val}</span>
                        ) : typeof val === 'number' ? (
                          <span className="tabular-nums">{val.toLocaleString('en-SA')}</span>
                        ) : val}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><polyline points="9 18 15 12 9 6"/></svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400">
          {rows.length} records
        </div>
      </div>
    </div>
  )
}

// ── KPI card with drill-down trigger ─────────────────────────────────────────

function KpiCard({ label, value, sub, subColor, drillData, onDrill }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5 group relative cursor-pointer hover:shadow-md transition-shadow"
      onClick={drillData ? () => onDrill(drillData) : undefined}>
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 leading-tight">{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: subColor || '#a3a3a3' }}>{sub}</div>}
      {drillData && (
        <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ── Report wrapper ────────────────────────────────────────────────────────────

function ReportWrapper({ title, rows, filename, children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-[15px]">{title}</h2>
        <button onClick={() => downloadCSV(filename, rows)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-700 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download {title}
        </button>
      </div>
      {children}
    </div>
  )
}

// ── Team Performance ──────────────────────────────────────────────────────────

function TeamPerformanceSection({ onDetail }) {
  const teams = DASHBOARD_STATS.teamPerformance
  const statusMeta = {
    'on-track': { label: 'On Track', color: '#262626', bg: '#f5f5f5', border: '#e5e5e5' },
    'at-risk':  { label: 'At Risk',  color: '#525252', bg: '#f0f0f0', border: '#d4d4d4' },
    'over':     { label: 'Over TAT', color: '#737373', bg: '#e5e5e5', border: '#c4c4c4' },
  }
  return (
    <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-[14px]">Team Performance</h3>
        <span className="text-[11px] text-slate-400">Click a row for details · TAT = Turn-Around Time vs Target</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['Team', 'Member', 'Avg TAT', 'Target', 'TAT Progress', 'Queue', 'Key Metric', 'Status'].map(h => (
                <th key={h} className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const meta = statusMeta[t.status]
              return (
                <tr key={i}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onDetail && onDetail(t, 'team')}>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-800 whitespace-nowrap">{t.team}</td>
                  <td className="px-5 py-4 text-[12px] text-slate-500">{t.member}</td>
                  <td className="px-5 py-4 text-[13px] tabular-nums font-medium text-slate-700">{t.avgTAT}</td>
                  <td className="px-5 py-4 text-[12px] text-slate-400">{t.targetTAT}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, t.tatPct)}%`, background: t.tatPct > 100 ? '#737373' : t.tatPct > 85 ? '#525252' : '#404040' }} />
                      </div>
                      <span className="text-[11px] tabular-nums text-slate-500">{t.tatPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] tabular-nums text-slate-700">{t.queueCount}</td>
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-bold text-slate-800">{t.keyMetric}</div>
                    <div className="text-[10px] text-slate-400">{t.keyMetricLabel}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                      style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Super Admin Overview tab ──────────────────────────────────────────────────

function SuperAdminOverview({ onDrill, onSwitchReport, onDetail }) {
  const s = DASHBOARD_STATS.sales
  const c = DASHBOARD_STATS.credit
  const inst = DASHBOARD_STATS.installments
  const r = DASHBOARD_STATS.risk
  const collectionRate = Math.round((inst.repaidAmount / (inst.repaidAmount + inst.amountToCollect)) * 100 * 10) / 10
  const approvalRate = c.statusByClient.find(x => x.label === 'Approve')?.pct || 0

  const reportHealth = [
    { id: 'credit', title: 'Credit Health', score: `${approvalRate}%`, sub: `${c.totalClients} applications · ${c.totalCreditLimit.toLocaleString('en-SA')} SAR total limit`, color: '#262626', status: 'Healthy' },
    { id: 'collections', title: 'Collections Health', score: `${collectionRate}%`, sub: `SAR ${fmtNum(inst.amountToCollect)} outstanding · ${inst.totalInstallments} installments`, color: '#525252', status: 'Monitor' },
    { id: 'risk', title: 'Risk Health', score: `${r.avgRiskScore}`, sub: `${r.highRiskCount} high-risk accounts · ${r.flaggedToday} flagged today`, color: '#737373', status: 'Attention' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Disbursement Volume" value={`SAR ${fmtNum(s.disbursementVolume)}`} sub="Total disbursed to date"
          drillData={{ title: 'Sales — All Orders', filename: 'sales_report', rows: DASHBOARD_STATS.salesRows, rowType: 'sales' }} onDrill={onDrill} />
        <KpiCard label="Portfolio Value" value={`SAR ${fmtNum(s.portfolio)}`} sub="Disbursement + MDR"
          drillData={{ title: 'Sales — All Orders', filename: 'sales_report', rows: DASHBOARD_STATS.salesRows, rowType: 'sales' }} onDrill={onDrill} />
        <KpiCard label="Total Collected" value={`SAR ${fmtNum(s.totalCollected)}`} sub="Repaid by buyers"
          drillData={{ title: 'Collections — All Installments', filename: 'collections_report', rows: DASHBOARD_STATS.collectionRows, rowType: 'collection' }} onDrill={onDrill} />
        <KpiCard label="Total Outstanding" value={`SAR ${fmtNum(s.totalOutstanding)}`} sub="Pending collection" subColor='#737373'
          drillData={{ title: 'Collections — All Installments', filename: 'collections_report', rows: DASHBOARD_STATS.collectionRows, rowType: 'collection' }} onDrill={onDrill} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Credit Approval Rate" value={`${approvalRate}%`} sub={`${c.totalClients} total applications`}
          drillData={{ title: 'Credit — All Applications', filename: 'credit_report', rows: DASHBOARD_STATS.creditRows, rowType: 'credit' }} onDrill={onDrill} />
        <KpiCard label="Collection Rate" value={`${collectionRate}%`} sub="Repaid vs total portfolio"
          drillData={{ title: 'Collections — All Installments', filename: 'collections_report', rows: DASHBOARD_STATS.collectionRows, rowType: 'collection' }} onDrill={onDrill} />
        <KpiCard label="Avg Portfolio Risk Score" value={r.avgRiskScore} sub={`${r.highRiskCount} high-risk accounts`} subColor='#737373'
          drillData={{ title: 'Risk — All Accounts', filename: 'risk_report', rows: DASHBOARD_STATS.riskRows, rowType: 'risk' }} onDrill={onDrill} />
        <KpiCard label="Monthly MDR" value={`${s.monthlyMDR}%`} sub={`Annualized: ${s.annualizedMDR.toFixed(2)}`}
          drillData={{ title: 'Sales — All Orders', filename: 'sales_report', rows: DASHBOARD_STATS.salesRows, rowType: 'sales' }} onDrill={onDrill} />
      </div>
      <TeamPerformanceSection onDetail={onDetail} />
      <div className="grid grid-cols-3 gap-4">
        {reportHealth.map(rh => (
          <div key={rh.id} className="bg-white rounded-2xl border border-black/5 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[13px] font-semibold text-slate-800">{rh.title}</div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: rh.color }}>{rh.status}</span>
            </div>
            <div className="text-3xl font-bold tabular-nums mb-1" style={{ color: rh.color }}>{rh.score}</div>
            <div className="text-[11px] text-slate-400 mb-4">{rh.sub}</div>
            <button onClick={() => onSwitchReport(rh.id)} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              View full report
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Role-specific views ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 leading-tight">{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: subColor || '#a3a3a3' }}>{sub}</div>}
    </div>
  )
}

function CreditView({ showSalesSummary, onDetail }) {
  const [localDetail, setLocalDetail] = useState(null)
  const handleDetail = onDetail || ((item, type) => setLocalDetail({ item, type }))

  const c = DASHBOARD_STATS.credit
  const s = DASHBOARD_STATS.sales
  const statusColor = { Approve: '#525252', Reject: '#525252', Pending: '#525252' }
  return (
    <div className="space-y-6">
      {!onDetail && localDetail && (
        <DetailModal item={localDetail.item} type={localDetail.type} onClose={() => setLocalDetail(null)} />
      )}
      {showSalesSummary && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Orders" value={s.orders} />
          <StatCard label="Buyer Count" value={s.buyerCount} />
          <StatCard label="Merchant Count" value={s.merchantCount} />
          <StatCard label="Monthly MDR" value={`${s.monthlyMDR}%`} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Total Applications</div>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wide">Client</div>
              <div className="text-3xl font-bold tabular-nums text-slate-900">{c.totalClients}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wide">Credit Limit</div>
              <div className="text-2xl font-bold tabular-nums text-slate-900">{new Intl.NumberFormat('en-SA').format(c.totalCreditLimit)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Status by Client</div>
          <DonutChart segments={c.statusByClient} size={130} />
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Classification by Record Count</div>
          <DonutChart
            segments={c.classificationByCount.map(x => ({ label: x.label, color: x.color, pct: Math.round(x.count / c.classificationByCount.reduce((a, y) => a + y.count, 0) * 100) }))}
            size={130}
          />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[14px]">Recent Credit Applications</h3>
          <span className="text-[11px] text-slate-400">Click any row for AI analysis</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['ID', 'Client', 'Type', 'Limit', 'Score', 'Reviewed by', 'Status'].map(h => (
                <th key={h} className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DASHBOARD_STATS.creditRows.map((app, i) => (
              <tr key={i}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleDetail(app, 'credit')}>
                <td className="px-5 py-3.5 text-[12px] font-mono text-slate-500">{app.ID}</td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-slate-800">{app.Client}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{app.Type}</td>
                <td className="px-5 py-3.5 text-[13px] tabular-nums">{new Intl.NumberFormat('en-SA').format(app['Limit (SAR)'])}</td>
                <td className="px-5 py-3.5 text-[13px] tabular-nums">{app['Simah Score']}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{app.reviewedBy}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                    style={{ background: statusColor[app.Status] }}>{app.Status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RiskView({ onDetail }) {
  const [localDetail, setLocalDetail] = useState(null)
  const handleDetail = onDetail || ((item, type) => setLocalDetail({ item, type }))

  const r = DASHBOARD_STATS.risk
  return (
    <div className="space-y-6">
      {!onDetail && localDetail && (
        <DetailModal item={localDetail.item} type={localDetail.type} onClose={() => setLocalDetail(null)} />
      )}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="High-Risk Accounts" value={r.highRiskCount} subColor='#737373' sub="Requires attention" />
        <StatCard label="Flagged Today" value={r.flaggedToday} subColor='#525252' sub="New flags" />
        <StatCard label="Avg Risk Score" value={r.avgRiskScore} sub="Portfolio average" />
        <StatCard label="Overdue Ratio" value={`${r.overdueRatio}%`} subColor='#737373' sub="Of total installments" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Risk Distribution by Account</div>
          <div className="space-y-3">
            {r.riskDistribution.map((seg, i) => {
              const total = r.riskDistribution.reduce((a, x) => a + x.count, 0)
              const pct = Math.round((seg.count / total) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-slate-600">{seg.label}</span>
                    <span className="text-[12px] font-semibold tabular-nums">{seg.count} accounts</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: seg.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Average Risk Score Trend</div>
          <div className="flex items-end gap-3 h-24">
            {r.riskTrend.map((pt, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="text-[10px] text-slate-500 mb-1">{pt.score}</div>
                <div className="w-full rounded-t" style={{ height: (pt.score / 60) * 80, background: pt.score > 40 ? '#737373' : '#404040' }} />
                <div className="text-[10px] text-slate-400 mt-1">{pt.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[14px]">All Monitored Accounts</h3>
          <span className="text-[11px] text-slate-400">Click any row for AI analysis</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['Buyer', 'Risk Score', 'Utilisation', 'Issue', 'Reviewed by', 'Next Review', 'Status'].map(h => (
                <th key={h} className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DASHBOARD_STATS.riskRows.map((b, i) => (
              <tr key={i}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleDetail(b, 'risk')}>
                <td className="px-5 py-3.5 text-[13px] font-medium text-slate-800">{b.Buyer}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: b['Risk Score'] > 70 ? '#737373' : b['Risk Score'] > 40 ? '#525252' : '#404040' }} />
                    <span className="text-[13px] font-semibold tabular-nums">{b['Risk Score']}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{b['Credit Utilisation']}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{b.Issue}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{b.lastReviewedBy}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{b.nextReviewDate}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border" style={{
                    color: b.Status === 'Escalated' ? '#737373' : b.Status === 'Alert Sent' ? '#525252' : b.Status === 'Monitoring' ? '#a3a3a3' : '#262626',
                    borderColor: '#d4d4d4',
                    background: '#f5f5f5',
                  }}>{b.Status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CollectionsView({ onDetail }) {
  const [localDetail, setLocalDetail] = useState(null)
  const handleDetail = onDetail || ((item, type) => setLocalDetail({ item, type }))

  const inst = DASHBOARD_STATS.installments
  const statusColor = { Paid: '#262626', Overdue: '#737373', 'Due Soon': '#525252' }
  return (
    <div className="space-y-6">
      {!onDetail && localDetail && (
        <DetailModal item={localDetail.item} type={localDetail.type} onClose={() => setLocalDetail(null)} />
      )}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Orders" value={inst.orders} />
        <StatCard label="Merchant Disbursement" value={`SAR ${fmtNum(inst.merchantDisbursement)}`} />
        <StatCard label="Amount to Collect" value={`SAR ${fmtNum(inst.amountToCollect)}`} subColor='#737373' sub="Outstanding" />
        <StatCard label="Record Count" value={inst.totalInstallments} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-2">Repaid Amount</div>
          <GaugeChart value={inst.repaidAmount} max={inst.repaidTarget} size={180} />
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Status by Buyer (Customer)</div>
          <DonutChart segments={inst.statusByBuyer} size={130} />
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Status by Installment Amount</div>
          <DonutChart segments={inst.statusByAmount} size={130} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-4">Record Count by Number of Installments</div>
          <HorizontalBarChart data={inst.byInstallmentCount} color="#93c5fd" />
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-2">Collection Status</div>
          <div className="flex items-center gap-3 mb-4">
            <PieChart segments={inst.collectionStatusByAmount} size={100} />
            <div className="space-y-1.5">
              {inst.collectionStatusByAmount.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[11px] text-slate-500">{s.label}</span>
                  <span className="text-[11px] font-semibold">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-700 mb-2">Installment Amount by Customer</div>
          <VerticalBarChart data={inst.amountByCustomer} height={90} color="#93c5fd" />
        </div>
      </div>
      {/* Installment detail table */}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[14px]">Installment Detail</h3>
          <span className="text-[11px] text-slate-400">Click any row for AI analysis</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['ID', 'Buyer', 'Seller', 'Amount (SAR)', 'Due Date', 'Installment', 'Days Overdue', 'Last Contact', 'Status'].map(h => (
                <th key={h} className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DASHBOARD_STATS.collectionRows.map((row, i) => (
              <tr key={i}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleDetail(row, 'collection')}>
                <td className="px-5 py-3.5 text-[12px] font-mono text-slate-500">{row.ID}</td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-slate-800">{row.Buyer}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{row.Seller}</td>
                <td className="px-5 py-3.5 text-[13px] tabular-nums">{(row['Amount (SAR)']).toLocaleString('en-SA')}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{row['Due Date']}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500">{row.installmentNumber}/{row.totalInstallments}</td>
                <td className="px-5 py-3.5 text-[12px] tabular-nums">{row['Days Overdue'] || '—'}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-400">{row.lastContactDate}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                    style={{ background: statusColor[row.Status] || '#94a3b8' }}>{row.Status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Super Admin wrapper with tabs ─────────────────────────────────────────────

const REPORT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'credit', label: 'Credit Report' },
  { id: 'collections', label: 'Collections Report' },
  { id: 'risk', label: 'Risk Report' },
]

function SuperAdminDashboard() {
  const [activeReport, setActiveReport] = useState('overview')
  const [drillTarget, setDrillTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  const handleDetail = (item, type) => {
    setDrillTarget(null)
    setDetailTarget({ item, type })
  }

  const renderReport = () => {
    switch (activeReport) {
      case 'overview':
        return <SuperAdminOverview onDrill={setDrillTarget} onSwitchReport={setActiveReport} onDetail={handleDetail} />
      case 'credit':
        return (
          <ReportWrapper title="Credit Report" rows={DASHBOARD_STATS.creditRows} filename="credit_report">
            <CreditView showSalesSummary onDetail={handleDetail} />
          </ReportWrapper>
        )
      case 'collections':
        return (
          <ReportWrapper title="Collections Report" rows={DASHBOARD_STATS.collectionRows} filename="collections_report">
            <CollectionsView onDetail={handleDetail} />
          </ReportWrapper>
        )
      case 'risk':
        return (
          <ReportWrapper title="Risk Report" rows={DASHBOARD_STATS.riskRows} filename="risk_report">
            <RiskView onDetail={handleDetail} />
          </ReportWrapper>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex gap-1 mb-6 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 p-1 w-fit">
        {REPORT_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveReport(tab.id)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: activeReport === tab.id ? 'var(--color-primary)' : 'transparent', color: activeReport === tab.id ? 'white' : 'var(--color-muted)' }}>
            {tab.label}
          </button>
        ))}
      </div>
      {renderReport()}
      <DrillDownDrawer target={drillTarget} onClose={() => setDrillTarget(null)} onRowDetail={handleDetail} />
      {detailTarget && (
        <DetailModal item={detailTarget.item} type={detailTarget.type} onClose={() => setDetailTarget(null)} />
      )}
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BizOverview() {
  const { state } = useApp()
  const user = state.currentUser
  const adminRole = user?.adminRole

  return (
    <div>
      <div className="mb-5">
        <p className="text-[12px] text-slate-400">
          Welcome back, {user?.name} · {user?.title || 'Head of Operations'}
        </p>
      </div>
      {adminRole === 'super' ? <SuperAdminDashboard />
        : adminRole === 'verifier' ? <CreditView showSalesSummary={false} />
        : adminRole === 'credit' ? <CreditView showSalesSummary />
        : adminRole === 'risk' ? <RiskView />
        : adminRole === 'collections' ? <CollectionsView />
        : <SuperAdminDashboard />}
    </div>
  )
}
