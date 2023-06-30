import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}


export const selectCurrency = createAction<{ field: Field; currencyId: string; inputTokens: string; outputTokens: string }>('bridge/selectCurrency')
export const selectChain = createAction<{ field: Field; chainId: string }>('bridge/selectChain')
export const switchChains = createAction<void>('bridge/switchChains')
export const typeInput = createAction<{ field: Field; typedValue: string }>('bridge/typeInput')
export const replaceBridgeState = createAction<{
  field: Field
  typedValue: string
  inputChainId?: string
  outputChainId?: string
  recipient: string | null,
  inputCurrencyId: string,
  outputCurrencyId: string
}>('bridge/replaceBridgeState')
// export const setRecipient = createAction<{ recipient: string | null }>('bridge/setRecipient')
