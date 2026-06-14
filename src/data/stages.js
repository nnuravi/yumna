// Single source of truth for the finance lifecycle: canonical stage order,
// transitions, display badges, and which persona owns the action at each stage.
// Every persona (admin pipelines, buyer, seller) imports from here — no more
// per-file stage maps that drift out of sync.

// Canonical transitions — mirror the admin FinanceRequestsPipeline lifecycle.
export const IF_NEXT_STAGE = {
  if_new_invoice:     'if_buyer_approval',
  if_buyer_approval:  'if_payment_plan',
  if_payment_plan:    'if_advance_payment',
  if_advance_payment: 'if_ship_notice',
  if_ship_notice:     'if_delivery_notice',
  if_delivery_notice: 'if_disbursement',
  if_disbursement:    'if_active',
}

export const DF_NEXT_STAGE = {
  df_new_request: 'df_approval',
  df_approval:    'df_disburse',
  df_disburse:    'df_payment_plan',
}

// Ordered steps for the compact persona trackers (buyer/seller drawer & lists).
export const IF_STEPS = [
  { key: 'if_new_invoice',     label: 'Submitted' },
  { key: 'if_buyer_approval',  label: 'Your Approval' },
  { key: 'if_payment_plan',    label: 'Payment Plan' },
  { key: 'if_ship_notice',     label: 'Shipment' },
  { key: 'if_delivery_notice', label: 'Delivery' },
  { key: 'if_disbursement',    label: 'Disbursing' },
  { key: 'if_active',          label: 'Active' },
]

export const DF_STEPS = [
  { key: 'df_new_request',  label: 'Submitted' },
  { key: 'df_approval',     label: 'Approval' },
  { key: 'df_disburse',     label: 'Disbursing' },
  { key: 'df_payment_plan', label: 'Repayment' },
]

// Unified badge map (colour + short label) for every finance stage.
export const STAGE_BADGE = {
  if_new_invoice:     { bg: '#eff6ff', text: '#1d4ed8', label: 'Under Review' },
  if_buyer_approval:  { bg: '#fef9c3', text: '#92400e', label: 'Action Required' },
  if_payment_plan:    { bg: '#eef2ff', text: '#4338ca', label: 'Payment Plan' },
  if_advance_payment: { bg: '#eef2ff', text: '#4338ca', label: 'Advance Payment' },
  if_ship_notice:     { bg: '#fff7ed', text: '#9a3412', label: 'Awaiting Shipment' },
  if_delivery_notice: { bg: '#fef9c3', text: '#92400e', label: 'Confirm Delivery' },
  if_disbursement:    { bg: '#f0fdf4', text: '#15803d', label: 'Being Funded' },
  if_active:          { bg: '#dcfce7', text: '#166534', label: 'Funded' },
  if_rejected:        { bg: '#fef2f2', text: '#b91c1c', label: 'Rejected' },
  df_new_request:     { bg: '#eff6ff', text: '#1d4ed8', label: 'Submitted' },
  df_approval:        { bg: '#fef9c3', text: '#92400e', label: 'Under Approval' },
  df_disburse:        { bg: '#f0fdf4', text: '#15803d', label: 'Disbursing' },
  df_active:          { bg: '#dcfce7', text: '#166534', label: 'Active' },
  df_payment_plan:    { bg: '#f0fdf4', text: '#166534', label: 'Repayment' },
  df_rejected:        { bg: '#fef2f2', text: '#b91c1c', label: 'Rejected' },
}

// Stages where each persona owns the action. (Phase 3 adds 'if_ship_notice'
// to the seller set once the shipment-confirmation action is built.)
export const BUYER_ACTION_STAGES = new Set(['if_buyer_approval', 'if_delivery_notice'])
export const SELLER_ACTION_STAGES = new Set(['if_new_invoice'])

export function nextStage(stage) {
  return IF_NEXT_STAGE[stage] || DF_NEXT_STAGE[stage] || null
}

export function stageBadge(stage) {
  return STAGE_BADGE[stage] || { bg: '#f5f5f5', text: '#525252', label: stage }
}
