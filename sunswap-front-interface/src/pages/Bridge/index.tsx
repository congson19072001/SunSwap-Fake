import { CurrencyAmount/*, JSBI*/, Token} from 'sunswap-sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { TransactionResponse } from '@ethersproject/providers'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { Dots } from '../../components/swap/styleds'
import { ButtonError, ButtonLight, ButtonConfirmed, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import ReactGA from 'react-ga'
// import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddBridgeSwap } from '../../components/NavigationTabs'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { useTransactionAdder } from '../../state/transactions/hooks'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { ArrowWrapper, BottomGrouping, Wrapper } from '../../components/swap/styleds'
import TokenWarningModal from '../../components/TokenWarningModal'
import { ChainId } from 'sunswap-sdk'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackBridge } from '../../hooks/useApproveCallback'
// import useENSAddress from '../../hooks/useENSAddress'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'

import {
  useBridgeActionHandlers,
  useDerivedBridgeInfo,
  useBridgeState
} from '../../state/bridge/hooks'
import { LinkStyledButton/*, TYPE*/ } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
// import { computeTradePriceBreakdown } from '../../utils/prices'
import AppBody from '../AppBody'
// import { ClickableText } from '../Pool/styleds'
// import Loader from '../../components/Loader'
import ChainInputPanel from '../../components/ChainInputPanel'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { useSelectedTokenList } from '../../state/lists/hooks'
import { requestSwitchNetwork } from '../../connectors'
import { SUPPORTED_BRIDGE } from '../../constants'
import { ethers } from 'ethers'

export default function Bridge() {
  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId)
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const { account, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()


  // swap state
  const { recipient } = useSwapState()

  const { independentField, typedValue} = useBridgeState();
  const transferredValue = Number(typedValue) * 0.97;

  const {
    chains,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError: bridgeInputError,
    bridge
  } = useDerivedBridgeInfo()
  const isValid = !bridgeInputError
  const { wrapType } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )

  const parsedAmounts = 
  {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount
  }
  const addTransaction = useTransactionAdder()
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  // const { address: recipientAddress } = useENSAddress(recipient)

  const { onChangeRecipient } = useSwapActionHandlers()
  const { onChainSelection, onSwitchChains, onUserInput, onCurrencySelection } = useBridgeActionHandlers()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? (transferredValue > 0 ? transferredValue.toString() : '')
      : (transferredValue > 0 ? (Number(typedValue) * 0.97).toFixed(6) : '')
  }
  let allTokens = useSelectedTokenList();
  let inputTokens: string = JSON.stringify(allTokens[chains[Field.INPUT]?.chainId as ChainId]);
  let outputTokens: string = JSON.stringify(allTokens[chains[Field.OUTPUT]?.chainId as ChainId]);


  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackBridge(parsedAmounts[Field.INPUT], SUPPORTED_BRIDGE.get(currencies[Field.INPUT]?.symbol ?? 'WMATIC'))

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput /*&& parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput)*/)

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])


  const handleInputSelect = useCallback(
    inputCurrency => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency, inputTokens, outputTokens)
    },
    [onCurrencySelection]
  )

  const handleInputChainSelect = useCallback(
    inputChain => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      inputTokens = JSON.stringify(allTokens[inputChain?.chainId as ChainId]);
      onChainSelection(Field.INPUT, inputChain)
    },
    [onChainSelection]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])


  async function onSwap() {
    if (approval === ApprovalState.APPROVED) {
      // sưap over bridge
      const liquidityAmount = parsedAmounts[Field.INPUT]
      if (!liquidityAmount) throw new Error('missing swap amount')
      // // try to gather a signature for permission
      if(!bridge) throw new Error('missing bridge')
      if(!account || !library) throw new Error('missing library')
      let nonce = 0;
      let isUsedNonce = await bridge.callStatic.processedNonces(account, nonce);
      while(isUsedNonce){
        nonce++;
        isUsedNonce = await bridge.callStatic.processedNonces(account, nonce);
      }
      const amountToBurn = ethers.BigNumber.from(parsedAmounts[Field.OUTPUT]?.raw.toString());
      const encodedData = ethers.utils.solidityPack(['address', 'address', 'uint256', 'uint256'], [account, account, amountToBurn, nonce]);
      const hash = ethers.utils.keccak256(encodedData);
      console.log(hash);
      // const signer = library?.getSigner(account);
      const signature = await library.send('personal_sign', [
        hash,
        account,
      ]);
      const safeGasEstimate = await bridge.estimateGas['burn'](account, amountToBurn, nonce, signature);
      await bridge['burn'](account, amountToBurn, nonce, signature, {
        gasLimit: safeGasEstimate
      }) .then((response: TransactionResponse) => {
        setAttemptingTxn(false)
        addTransaction(response, {
          summary:
            'Burn ' +
            parsedAmounts[Field.INPUT]?.toSignificant(3) +
            ' ' +
            currencies[Field.INPUT]?.symbol +
            ' and received ' +
            parsedAmounts[Field.OUTPUT]?.toSignificant(3) +
            ' ' +
            currencies[Field.OUTPUT]?.symbol
        })

        setTxHash(response.hash)

        ReactGA.event({
          category: 'Bridge',
          action: 'Transfer',
          label: [currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol].join('/')
        })
      })
      .catch((error: Error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        console.error(error)
      })
    } else {
      throw new Error('Attempting to confirm without approval. Please contact support.')
    }

  }


  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.INPUT]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencies[Field.INPUT]?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Text fontSize={12} fontWeight={300}>
            {`From Chain ${chains[Field.INPUT]?.chainId} to Chain ${chains[Field.OUTPUT]?.chainId}`}
          </Text>
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {formattedAmounts[Field.OUTPUT]}
          </Text>
          <RowFixed gap="4px">
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencies[Field.INPUT]?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
      </AutoColumn>
    )
  }

  const pendingText = `Transfering ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
    currencies[Field.INPUT]?.symbol
  } and ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${currencies[Field.OUTPUT]?.symbol}`

  function modalBottom() {
    return (
      <>
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onSwap}>
          <Text fontWeight={500} fontSize={20}>
            Confirm
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const handleOutputChainSelect = useCallback(outputChain => {
    outputTokens = JSON.stringify(allTokens[outputChain?.chainId as ChainId]);
    onChainSelection(Field.OUTPUT, outputChain)
  }
    , [
    onCurrencySelection
  ])

  return (
    <>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <AppBody>
        <AddBridgeSwap />
        <Wrapper id="swap-page">
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            content={() => (
              <ConfirmationModalContent
                title={'You will Transfer below tokens cross-chain'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />

          <AutoColumn gap={'md'}>
            <ChainInputPanel
              label={independentField === Field.OUTPUT && !showWrap ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              chain={chains[Field.INPUT]}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onChainSelect={handleInputChainSelect}
              otherChain={chains[Field.OUTPUT]}
              id="bridge-chain-input"
              type={Field.INPUT}
            />
             <CurrencyInputPanel
              label={independentField === Field.OUTPUT && !showWrap ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              id="bridge-currency-input"
              hideInput={true}
              otherChainId={chains[Field.OUTPUT]?.chainId ?? 1}
            />
            <AutoColumn justify="space-between">
              <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
                <ArrowWrapper clickable>
                  <ArrowDown
                    size="16"
                    onClick={async() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      await requestSwitchNetwork(chains[Field.OUTPUT]?.chainId ?? 1);

                      onSwitchChains()
                    }}
                    color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.primary1 : theme.text2}
                  />
                </ArrowWrapper>
                {recipient === null && !showWrap  ? (
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <ChainInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={independentField === Field.INPUT && !showWrap ? 'To (estimated)' : 'To'}
              currency={currencies[Field.OUTPUT]}
              showMaxButton={false}
              chain={chains[Field.OUTPUT]}
              onChainSelect={handleOutputChainSelect}
              otherChain={chains[Field.INPUT]}
              chainId={chains[Field.OUTPUT]?.chainId}
              id="bridge-chain-output"
              type={Field.OUTPUT}
            />

            {recipient !== null && !showWrap ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="swap-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Swap send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}
          </AutoColumn>
          <BottomGrouping>
          <div style={{ position: 'relative' }}>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
              ) : (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={approveCallback}
                    confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                    disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                    mr="0.5rem"
                    fontWeight={500}
                    fontSize={16}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <Dots>Approving</Dots>
                    ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                      'Approved'
                    ) : (
                      'Approve'
                    )}
                  </ButtonConfirmed>
                  <ButtonError
                    onClick={() => {
                      setShowConfirm(true)
                    }}
                    disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                    error={!isValid && !!parsedAmounts[Field.INPUT] && !!parsedAmounts[Field.OUTPUT]}
                  >
                    <Text fontSize={16} fontWeight={500}>
                      {bridgeInputError || 'Swap'}
                    </Text>
                  </ButtonError>
                </RowBetween>
              )}
            </div>
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
