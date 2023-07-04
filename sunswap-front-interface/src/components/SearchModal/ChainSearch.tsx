import Column from '../Column'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useAllChains } from '../../hooks/Chains'
import ChainList from './ChainList'
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChainSelect } from '../../connectors'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import ReactGA from 'react-ga'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { CloseIcon } from '../../theme'
import { isAddress } from '../../utils'
import QuestionHelper from '../QuestionHelper'
import { RowBetween } from '../Row'
import ChainCommonBases from './ChainCommonBases'
import { filterChains } from './filtering'
import SortButton from './SortButton'
import { useChainComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import { Field } from '../../state/swap/actions'

interface ChainSearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedChain?: ChainSelect | null
  onChainSelect: (chain: ChainSelect) => void
  otherselectedChain?: ChainSelect | null
  showCommonBases?: boolean
  onChangeList: () => void
  type: Field
}



export function ChainSearch({
  selectedChain,
  onChainSelect,
  otherselectedChain,
  showCommonBases,
  onDismiss,
  isOpen,
  onChangeList,
  type
}: ChainSearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)

  const allChains = useAllChains();
  const handleChainSelect = useCallback(
    (chain: ChainSelect) => {
      onChainSelect(chain)
      onDismiss()
    },
    [onDismiss, onChainSelect]
  )

  const isAddressSearch = isAddress(searchQuery)
  const searchToken = useToken(searchQuery)
  console.log('searchToken', searchToken)

  useEffect(() => {
    if (isAddressSearch) {
      ReactGA.event({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch
      })
    }
  }, [isAddressSearch])

  const chainComparator = useChainComparator(invertSearchOrder)

  const filteredChains: ChainSelect[] = useMemo(() => {
    return filterChains(Object.values(allChains), searchQuery)
  }, [allChains, searchQuery])

  const filteredSortedChains: ChainSelect[] = useMemo(() => {
    // if (searchToken) return [searchToken]
    const sorted = filteredChains.sort(chainComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      ...sorted.filter(chain => chain.chainId?.toString() === symbolMatch[0]),
      ...sorted.filter(chain => chain.chainId?.toString() !== symbolMatch[0])
    ]
  }, [filteredChains, searchQuery, chainComparator])

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        // const s = searchQuery.toLowerCase().trim()
        if (filteredSortedChains.length > 0) {
          if (
            filteredSortedChains[0].chainId.toString() === searchQuery.trim().toLowerCase() ||
            filteredSortedChains.length === 1
          ) {
            handleChainSelect(filteredSortedChains[0])
          }
        }
      }
    },
    [filteredSortedChains, handleChainSelect, searchQuery]
  )

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a chain
            <QuestionHelper text="Find a chain by searching for its name or symbol or by pasting its address below." />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <SearchInput
          type="text"
          id="chain-search-input"
          placeholder={t('chainSearchPlaceholder')}
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
        {showCommonBases && (
          <ChainCommonBases chainId={chainId} onSelect={handleChainSelect} selectedChain={selectedChain} />
        )}
        <RowBetween>
          <Text fontSize={14} fontWeight={500}>
            Chain Name
          </Text>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
        </RowBetween>
      </PaddedColumn>

      <Separator />
      
      <div style={{ flex: '1' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <ChainList
            showETH={false}
              height={height}
              chains={allChains}
              onChainSelect={handleChainSelect}
              otherChain={otherselectedChain}
              selectedChain={null}
              fixedListRef={undefined}
            />
          )}
        </AutoSizer>
      </div>
      <Separator />
    </Column>
  )
}
