import React from 'react'
import { Text } from 'rebass'
import { ChainId/*, currencyEquals, Token*/ } from 'sunswap-sdk'
import styled from 'styled-components'

import { MUMBAI_CHAIN, CHAIN_SUPPORTED, ChainFinal } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
// import CurrencyLogo from '../CurrencyLogo'
import { ChainSelect } from '../../connectors'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  border-radius: 10px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

export default function ChainCommonBases({
  chainId,
  onSelect,
  selectedChain
}: {
  chainId?: ChainId
  selectedChain?: ChainSelect | null
  onSelect: (chain: ChainSelect) => void
}) {
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14}>
          Common bases
        </Text>
        <QuestionHelper text="These tokens are commonly paired with other tokens." />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => {
            if (!selectedChain || selectedChain.chainId !== MUMBAI_CHAIN.chainId) {
              onSelect(MUMBAI_CHAIN)
            }
          }}
          disable={selectedChain === MUMBAI_CHAIN}
        >
          {/* <CurrencyLogo currency={MUMBAI_CHAIN} style={{ marginRight: 8 }} /> */}
          <Text fontWeight={500} fontSize={16}>
            {MUMBAI_CHAIN.chainId}
          </Text>
        </BaseWrapper>
        {(chainId ? CHAIN_SUPPORTED[chainId] : []).map((chain: ChainSelect) => {
          const selected = selectedChain instanceof ChainFinal && selectedChain?.chainId === chain.chainId
          return (
            <BaseWrapper onClick={() => !selected && onSelect(chain)} disable={selected} key={chain.chainId}>
              {/* <CurrencyLogo currency={chain} style={{ marginRight: 8 }} /> */}
              <Text fontWeight={500} fontSize={16}>
                {chain.chainId}
              </Text>
            </BaseWrapper>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}

