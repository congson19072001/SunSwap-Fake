import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceBridgeState, selectChain, selectCurrency, switchChains, typeInput } from './actions'
// import { requestSwitchNetwork } from '../../connectors'
import { WrappedTokenInfo } from '../lists/hooks'
// import { ChainId } from 'sunswap-sdk'

export interface BridgeState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly chainId: string | undefined
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly chainId: string | undefined
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if bridge should go to sender
  readonly recipient: string | null
}

const initialState: BridgeState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    chainId: '',
    currencyId: ''
  },
  [Field.OUTPUT]: {
    chainId: '',
    currencyId: ''
  },
  recipient: null
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(
      replaceBridgeState,
      (state, { payload: { typedValue, recipient, field, inputChainId, outputChainId, inputCurrencyId, outputCurrencyId  } }) => {
        return {
          [Field.INPUT]: {
            chainId: inputChainId?.toString(),
            currencyId: inputCurrencyId
          },
          [Field.OUTPUT]: {
            chainId: outputChainId?.toString(),
            currencyId: outputCurrencyId
          },
          independentField: field,
          typedValue: typedValue,
          recipient
        }
      }
    )
    .addCase(selectChain, (state, { payload: { chainId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (chainId == state[otherField].chainId) {
        // the case where we have to bridge the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: {
            ...state[field],
            chainId: chainId
          },
          [otherField]: {
            ...state[otherField],
            chainId: state[field].chainId
          }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: {
            ...state[field],
            chainId: chainId 
          }
        }
      }
    })
    .addCase(selectCurrency, (state, { payload: { currencyId, field, inputTokens, outputTokens } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;
      const _inputTokens: { [tokenAddress: string]: WrappedTokenInfo } = JSON.parse(inputTokens);
      const _outputTokens: { [tokenAddress: string]: WrappedTokenInfo } = JSON.parse(outputTokens);
      console.log(currencyId, _inputTokens, _inputTokens[currencyId]);
      
      const currentCurrencyName = field === Field.INPUT ? _inputTokens[currencyId]?.name : _outputTokens[currencyId]?.name;
      const otherCurrencyId = field === Field.INPUT ? Object.values(_outputTokens).find(token => token?.name === currentCurrencyName)?.address 
      : Object.values(_inputTokens).find(token => token?.name === currentCurrencyName)?.address;
      // if (currencyId === state[otherField].currencyId) {
      //   // the case where we have to swap the order
      //   return {
      //     ...state,
      //     independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
      //     [field]: { currencyId: currencyId },
      //     [otherField]: { currencyId: state[field].currencyId }
      //   }
      // } else {
        // the normal case
        return {
          ...state,
          [field]: {
            ...state[field],
            currencyId: currencyId
          },
          [otherField]: {
            ...state[otherField],
            currencyId: otherCurrencyId 
          }
        }
      // }
    })
    .addCase(switchChains, state => {
      // requestSwitchNetwork(Number(state[Field.OUTPUT].chainId));
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: {
          currencyId: state[Field.OUTPUT].currencyId,
          chainId: state[Field.OUTPUT].chainId },
        [Field.OUTPUT]: {
          currencyId: state[Field.INPUT].currencyId,
          chainId: state[Field.INPUT].chainId
        }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
    // .addCase(setRecipient, (state, { payload: { recipient } }) => {
    //   state.recipient = recipient
    // })
)
