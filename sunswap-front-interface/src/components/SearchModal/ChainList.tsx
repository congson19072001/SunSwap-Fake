// import { Currency, ETHER, Token } from 'sunswap-sdk'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import Column from '../Column'
import { MenuItem } from './styleds'
import { ChainSelect } from '../../connectors'
import React from 'react'

// function currencyKey(currency: Currency): string {
//   return currency instanceof Token ? currency.address : currency === ETHER ? 'ETHER' : ''
// }

function currencyKey(vassr: ChainSelect): string {
  return vassr.chainId.toString();
}

function ChainRow({
  chain,
  onSelect,
  isSelected,
  otherSelected,
  style
}: {
  chain: ChainSelect
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${chain.chainId}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <img src={chain.img} width={'24px'} height={'24px'} />
      <Column>
        <Text title={chain.name + ''} fontWeight={500}>
          {chain.name}
        </Text>
      </Column>
    </MenuItem>
  )
}

export default function ChainList({
  height,
  chains,
  selectedChain,
  onChainSelect,
  otherChain,
  fixedListRef}: {
  height: number
  chains: ChainSelect[]
  selectedChain?: ChainSelect | null
  onChainSelect: (Chain: ChainSelect) => void
  otherChain?: ChainSelect | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showETH: boolean
}) {
  const itemData = useMemo(() =>  chains, [chains])

  const Row = useCallback(
    ({ data, index, style }) => {
      const chain: ChainSelect = data[index]
      const isSelected = Boolean(selectedChain && (chain.chainId === selectedChain?.chainId))
      const otherSelected = Boolean(otherChain && selectedChain && (chain.chainId === selectedChain?.chainId))
      const handleSelect = () => {
        onChainSelect(chain);
      }
      return (
        <ChainRow
          style={style}
          chain={chain}
          isSelected={isSelected}
          onSelect={handleSelect}
          otherSelected={otherSelected}
        />
      )
    },
    [onChainSelect, otherChain, selectedChain]
  )

  const itemKey = useCallback((index: number, data: any) => currencyKey(data[index]), [])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
