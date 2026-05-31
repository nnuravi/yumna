import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { TASKS, TEAM_CAPACITY } from '../../data/mockData'

const PRIORITY_META = {
  critical: { label: 'Critical', color: '#e5484d', bg: '#fef2f2', border: '#fca5a5' },
  high:     { label: 'High',     color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  medium:   { label: 'Medium',   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  low:      { label: 'Low',      color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
}

const STATUS_META = {
  open:       { label: 'Open',        color: '#6b7280' },
  in_progress:{ label: 'In Progress', color: '#0891b2' },
  pending:    { label: 'Pending',     color: '#f59e0b' },
  blocked:    { label: 'Blocked',     color: '#e5484d' },
  unassigned: { label: 'Unassigned',  color: '#e5484d' },
  done:       { label: 'Done',        color: '#10b981' },
}

export default function TaskManager() {
  const { state } = useApp()
  const adminRole = state.currentUser?.adminRole
  const userName = state.currentUser?.name

  const [viewMine, setViewMine] = useState(true)
  const [reassigning, setReassigning] = useState(null)
  const [tasks, setTasks] = useState(TASKS)
  const [yumiApplied, setYumiApplied] = useState(false)

  const visibleTasks = viewMine && adminRole !== 'super'
    ? tasks.filter(t => t.assignedTo === userName || t.status === 'unassigned' && t.team === adminRole)
    : tasks

  const unassigned = tasks.filter(t => t.status === 'unassigned').length
  const overdueSLA = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length

  const handleReassign = (taskId, to) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: to, status: 'open' } : t))
    setReassigning(null)
  }

  const handleYumiAssign = () => {
    setTasks(prev => prev.map(t => {
      if (t.status !== 'unassigned') return t
      const capacityMap = { verifier: 'Sara Al-Ghamdi', credit: 'Faisal Al-Dosari', risk: 'Noura Al-Shehri', collections: 'Omar Al-Mutairi', account_mgr: 'Rania Al-Sabban', legal: 'Tariq Al-Ghamdi' }
      return { ...t, assignedTo: capacityMap[t.team] || t.assignedTo, status: 'open' }
    }))
    setYumiApplied(true)
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Yumi banner */}
      {(unassigned > 0 || overdueSLA > 0) && !yumiApplied && (
        <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'rgba(143,133,255,0.06)', borderColor: 'rgba(143,133,255,0.2)' }}>
          <span className="text-[20px]">✦</span>
          <div className="flex-1">
            <div className="font-semibold text-[13px] text-slate-800 mb-0.5">Yumi · Task Alert</div>
            <div className="text-[12px] text-slate-500">
              {unassigned > 0 && `${unassigned} task${unassigned > 1 ? 's are' : ' is'} unassigned. `}
              {overdueSLA > 0 && `${overdueSLA} critical task${overdueSLA > 1 ? 's are' : ' is'} approaching SLA. `}
              I can auto-assign unassigned tasks based on team capacity.
            </div>
          </div>
          <button onClick={handleYumiAssign}
            className="px-4 py-2 rounded-xl text-white font-semibold text-[12px] shrink-0"
            style={{ background: 'var(--color-primary)' }}>
            Auto-assign →
          </button>
        </div>
      )}
      {yumiApplied && (
        <div className="rounded-2xl border p-4" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <span className="font-semibold text-emerald-700 text-[13px]">✓ Yumi auto-assigned all unassigned tasks based on current team capacity.</span>
        </div>
      )}

      {/* Team capacity */}
      <div className="bg-white rounded-2xl border border-black/5 p-5">
        <div className="text-[13px] font-semibold text-slate-800 mb-4">Team Capacity</div>
        <div className="grid grid-cols-3 gap-4">
          {TEAM_CAPACITY.map(member => {
            const pct = Math.round((member.currentLoad / member.maxLoad) * 100)
            const color = pct >= 90 ? '#e5484d' : pct >= 70 ? '#f59e0b' : '#10b981'
            return (
              <div key={member.memberId} className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[12px] font-semibold text-slate-700">{member.name}</span>
                  <span className="text-[11px] tabular-nums" style={{ color }}>{member.currentLoad}/{member.maxLoad}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-[10px] text-slate-400">{member.team.replace('_', ' ')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter + task list */}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
          <h3 className="font-semibold text-slate-800 text-[14px] flex-1">Tasks</h3>
          {adminRole !== 'super' && (
            <div className="flex gap-1 bg-slate-50 rounded-xl p-1">
              {[['mine', 'My Tasks'], ['all', 'All Tasks']].map(([v, l]) => (
                <button key={v} onClick={() => setViewMine(v === 'mine')}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{ background: (viewMine ? 'mine' : 'all') === v ? 'white' : 'transparent', color: (viewMine ? 'mine' : 'all') === v ? 'var(--color-primary)' : '#94a3b8' }}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['Task', 'Card', 'Assigned to', 'Due', 'Priority', 'Status', ''].map(h => (
                <th key={h} className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map(task => {
              const pm = PRIORITY_META[task.priority]
              const sm = STATUS_META[task.status] || STATUS_META.open
              return (
                <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold text-slate-800">{task.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{task.id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {task.cardId ? (
                      <span className="text-[12px] font-mono text-indigo-600 font-semibold">{task.cardId}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {task.assignedTo
                      ? <span className="text-[12px] text-slate-600">{task.assignedTo}</span>
                      : <span className="text-[12px] font-semibold text-red-500">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{task.dueDate}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                      style={{ color: pm.color, background: pm.bg, borderColor: pm.border }}>
                      {pm.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] font-medium" style={{ color: sm.color }}>{sm.label}</span>
                  </td>
                  <td className="px-5 py-3.5 relative">
                    <button onClick={() => setReassigning(reassigning === task.id ? null : task.id)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      Reassign
                    </button>
                    {reassigning === task.id && (
                      <div className="absolute right-5 top-10 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-2 w-52">
                        {TEAM_CAPACITY.map(member => (
                          <button key={member.memberId}
                            onClick={() => handleReassign(task.id, member.name)}
                            className="w-full text-start px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                            <div className="text-[12px] font-semibold text-slate-700">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.currentLoad}/{member.maxLoad} tasks</div>
                          </button>
                        ))}
                      </div>
                    )}
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
