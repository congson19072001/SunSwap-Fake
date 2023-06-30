// import { Currency } from 'sunswap-sdk'
import { useCallback, useEffect, useState } from 'react'
import ReactGA from 'react-ga'
import useLast from '../../hooks/useLast'
import { useSelectedListUrl } from '../../state/lists/hooks'
import Modal from '../Modal'
import { ChainSearch } from './ChainSearch'
import React from 'react'
import { ChainSelect } from '../../connectors'
import { Field } from '../../state/swap/actions'

interface ChainSearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedChain?: ChainSelect | null
  onChainSelect: (chain: ChainSelect) => void
  otherselectedChain?: ChainSelect | null
  showCommonBases?: boolean
  type: Field
}

export default function ChainSearchModal({
  isOpen,
  onDismiss,
  onChainSelect,
  selectedChain,
  otherselectedChain,
  showCommonBases = false,
  type
}: ChainSearchModalProps) {
  const [listView, setListView] = useState<boolean>(false)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) { 
      setListView(false)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (chain: ChainSelect) => {
      onChainSelect(chain)
      onDismiss()
    },
    [onDismiss, onChainSelect]
  )

  const handleClickChangeList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Change Lists'
    })
    setListView(true)
  }, [])

  const selectedListUrl = useSelectedListUrl()
  const noListSelected = !selectedListUrl

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={listView ? 40 : noListSelected ? 0 : 80}>
      {
        <ChainSearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onChainSelect={handleCurrencySelect}
          onChangeList={handleClickChangeList}
          selectedChain={selectedChain}
          otherselectedChain={otherselectedChain}
          showCommonBases={showCommonBases}
          type={type}
        />
      }
    </Modal>
  )
}
