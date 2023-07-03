import { createReducer } from '@reduxjs/toolkit'
import { Field, approvedSwap, replaceBridgeState, selectChain, selectCurrency, switchChains, typeInput, updateSwapStatus } from './actions'
// import { requestSwitchNetwork } from '../../connectors'
import { WrappedTokenInfo } from '../lists/hooks'
import { SUPPORTED_BRIDGE } from '../../constants'
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
  readonly swapped: boolean,
  readonly signature: string,
  readonly nonce: number,
  readonly bridgeContract: string | undefined
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
  recipient: null,
  swapped: false,
  signature: '',
  nonce: 0,
  bridgeContract: undefined
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(
      replaceBridgeState,
      (state, { payload: { typedValue, recipient, field, inputChainId, outputChainId, inputCurrencyId, outputCurrencyId, swapped, signature, nonce , contract} }) => {
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
          recipient,
          swapped,
          signature,
          nonce,
          bridgeContract: contract
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
      const currentCurrencyName = field === Field.INPUT ? _inputTokens[currencyId]?.name : _outputTokens[currencyId]?.name;
      const otherCurrencyId = field === Field.INPUT ? Object.values(_outputTokens).find(token => token?.name === currentCurrencyName)?.address 
      : Object.values(_inputTokens).find(token => token?.name === currentCurrencyName)?.address;
      const currencySymbol = (field === Field.INPUT ? _inputTokens[currencyId]?.symbol : _outputTokens[currencyId]?.symbol);
      const bridgeContract = currencySymbol ? SUPPORTED_BRIDGE.get(currencySymbol) : undefined;
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
          },
          bridgeContract
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
    .addCase(updateSwapStatus, (state, { payload: { status } }) => {
      return {
        ...state,
        swapped: status
      }
    })
    .addCase(approvedSwap, (state, { payload: { nonce, signature } }) => {
      return {
        ...state,
        signature,
        nonce
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
