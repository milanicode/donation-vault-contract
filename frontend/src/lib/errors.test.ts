import { describe, expect, it } from 'vitest'
import { describeTxError } from './errors.ts'

describe('describeTxError', () => {
  it('recognises a wallet rejection by code, name or text', () => {
    const expected = 'You cancelled the request in your wallet.'
    expect(describeTxError({ code: 4001, message: 'whatever' })).toBe(expected)
    expect(describeTxError({ name: 'UserRejectedRequestError' })).toBe(expected)
    expect(describeTxError(new Error('MetaMask Tx Signature: User denied transaction'))).toBe(
      expected,
    )
  })

  it('finds a rejection nested in the cause chain', () => {
    const error = { name: 'TransactionExecutionError', cause: { cause: { code: 4001 } } }
    expect(describeTxError(error)).toBe('You cancelled the request in your wallet.')
  })

  it('translates contract revert reasons', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      shortMessage: 'The contract function "claimRefund" reverted with the following reason:\nGoal met',
    }
    expect(describeTxError(error)).toBe('The goal was reached, so refunds are not available.')
  })

  it('does not confuse "Goal not met" with "Goal met"', () => {
    expect(describeTxError(new Error('execution reverted: Goal not met'))).toBe(
      'The goal was not reached, so the organizer cannot withdraw.',
    )
  })

  it('explains insufficient funds', () => {
    expect(describeTxError(new Error('insufficient funds for gas * price + value'))).toMatch(
      /does not have enough ETH/,
    )
  })

  it('falls back to the first line of the message', () => {
    expect(describeTxError(new Error('Request timed out.\nURL: http://localhost'))).toBe(
      'Request timed out.',
    )
  })

  it('has a generic fallback for unknown values', () => {
    expect(describeTxError(undefined)).toBe('Something went wrong. Please try again.')
    expect(describeTxError({})).toBe('Something went wrong. Please try again.')
  })
})
