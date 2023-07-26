import { ChainId } from 'sunswap-sdk'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'

import styled from 'styled-components'

import Logo from '../../assets/svg/logo_white.png'
import LogoDark from '../../assets/svg/logo.png'
import Wordmark from '../../assets/svg/wordmark.png'
import WordmarkDark from '../../assets/svg/wordmark_white.png'
import { useActiveWeb3React } from '../../hooks'
import { useDarkModeManager } from '../../state/user/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { Repeat, Home, Server, Link } from 'react-feather'

import { YellowCard } from '../Card'
import Settings from '../Settings'
import Menu from '../Menu'

import Row, { RowBetween } from '../Row'
import Web3Status from '../Web3Status'
import { NavLink } from 'react-router-dom'
// import VersionSwitch from './VersionSwitch'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  top: 0;
  position: absolute;
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 12px 0 0 0;
    width: calc(100%);
    position: relative;
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 0.5rem;
`};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;

  :hover {
    cursor: pointer;
  }
`

const TitleText = styled(Row)`
  width: fit-content;
  white-space: nowrap;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;

  :focus {
    border: 1px solid blue;
  }
`

const TestnetWrapper = styled.div`
  white-space: nowrap;
  width: fit-content;
  margin-left: 10px;
  pointer-events: auto;
`

const NetworkCard = styled(YellowCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 8px 12px;
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    img { 
      width: 4.5rem;
    }
  `};
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-end;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`;

const NavigationMenu = styled.ul`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 0;
  padding: 0 0;
  list-style: none;

  @media only screen and (max-width: 600px) {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 60px;
    right: 0;
    width: 100%;
    background-color: #333;
    color: white;

    &.open {
      display: flex;
      flex-direction: column;
    }
  }
`;

const NavigationMenuItem = styled.li`
  margin: 0 15px;

  a {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
    font-size: 18px;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const SwapButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.text1};
  font-size: 18px;
  cursor: pointer;

  svg {
    margin-right: 5px;
  }
`;

const FaSwap = styled(Repeat)`
  height: 18px;
  width: 18px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const FaHome = styled(Home)`
  height: 18px;
  width: 18px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const FaPool = styled(Server)`
  height: 18px;
  width: 18px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`
const FaBridge = styled(Link)`
  height: 18px;
  width: 18px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`


const NETWORK_LABELS: { [chainId in ChainId]: string | null } = {
  [ChainId.MAINNET]: null,
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan',
  [ChainId.POLYGON]: 'Polygon',
  [ChainId.POLYGON_MUMBAI]: 'Polygon Mumbai',
  [ChainId.BINANCE]: 'Binance',
  [ChainId.BINANCE_TESTNET]: 'Binance Testnet',
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const [isDark] = useDarkModeManager()

  return (
    <HeaderFrame>
      <RowBetween style={{ alignItems: 'flex-start' }} padding="1rem 1rem 0 1rem">
        <HeaderElement>
          <Title href=".">
            <UniIcon>
              <img src={isDark ? LogoDark : Logo} alt="logo" />
            </UniIcon>
            <TitleText>
              <img style={{ marginLeft: '4px', marginTop: '4px' }} src={isDark ? WordmarkDark : Wordmark} alt="logo" />
            </TitleText>
          </Title>
          <NavigationMenu className='open'>
              <NavLink to="/">
                <NavigationMenuItem><SwapButton><FaHome />Home</SwapButton></NavigationMenuItem>
              </NavLink>
              <NavLink to="/swap">
                <NavigationMenuItem><SwapButton><FaSwap />Swap</SwapButton></NavigationMenuItem>
              </NavLink>
              <NavLink to="/pool">
                <NavigationMenuItem><SwapButton><FaPool />Pool</SwapButton></NavigationMenuItem>
              </NavLink>
              <NavLink to="/bridge">
                <NavigationMenuItem><SwapButton><FaBridge />Bridge</SwapButton></NavigationMenuItem>
              </NavLink>
          </NavigationMenu>
        </HeaderElement>
        <HeaderControls>
          <HeaderElement>
            <TestnetWrapper>
              {!isMobile && chainId && NETWORK_LABELS[chainId] && <NetworkCard>{NETWORK_LABELS[chainId]}</NetworkCard>}
            </TestnetWrapper>
            <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
              {account && userEthBalance ? (
                <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                  {userEthBalance?.toSignificant(4)} ETH
                </BalanceText>
              ) : null}
              <Web3Status />
            </AccountElement>
          </HeaderElement>
          <HeaderElementWrap>
            {/* <VersionSwitch /> */}
            <Settings />
            <Menu />
          </HeaderElementWrap>
        </HeaderControls>
      </RowBetween>
    </HeaderFrame>
  )
}
