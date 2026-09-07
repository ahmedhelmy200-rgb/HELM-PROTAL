import { useEffect } from 'react'
import { getAdib2026DatasetSummary, seedAdibStatements2026 } from '@/lib/adibStatementSeed2026'

const EXPECTED = {
  statementRows: 453,
  expenseCount: 374,
  expenseTotal: 45282.89,
  incomeCount: 27,
  incomeTotal: 31290.85,
  clientPaymentCount: 32,
  clientPaymentTotal: 47322.50,
}

function cents(value) {
  return Math.round(Number(value || 0) * 100)
}

function assertDatasetIntegrity() {
  const actual = getAdib2026DatasetSummary()
  const valid = actual.statementRows === EXPECTED.statementRows
    && actual.expenseCount === EXPECTED.expenseCount
    && cents(actual.expenseTotal) === cents(EXPECTED.expenseTotal)
    && actual.incomeCount === EXPECTED.incomeCount
    && cents(actual.incomeTotal) === cents(EXPECTED.incomeTotal)
    && actual.clientPaymentCount === EXPECTED.clientPaymentCount
    && cents(actual.clientPaymentTotal) === cents(EXPECTED.clientPaymentTotal)
  if (!valid) {
    throw new Error(`ADIB dataset reconciliation failed: ${JSON.stringify(actual)}`)
  }
  return actual
}

export default function AdibStatementSeedBridge({ user }) {
  useEffect(() => {
    let active = true
    const role = String(user?.role || '')
    if (!role) return undefined

    try {
      assertDatasetIntegrity()
    } catch (error) {
      console.error('[HELM][ADIB] Dataset validation stopped the import:', error)
      return undefined
    }

    seedAdibStatements2026({ role })
      .then((result) => {
        if (!active || !result || result.skipped || !result.changed) return
        console.info('[HELM][ADIB] Bank statements synchronized', result)
      })
      .catch((error) => {
        if (!active) return
        console.error('[HELM][ADIB] Automatic bank-statement sync failed:', error)
      })

    return () => { active = false }
  }, [user?.email, user?.role])

  return null
}
