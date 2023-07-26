import { parseBytes32String } from '@ethersproject/strings'
import { ChainId, Currency, ETHER, Token, currencyEquals } from 'sunswap-sdk'
import { useMemo } from 'react'
import { WrappedTokenInfo, useSelectedTokenList } from '../state/lists/hooks'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useUserAddedTokens } from '../state/user/hooks'
import { isAddress } from '../utils'

import { useActiveWeb3React } from './index'
import { useBytes32TokenContract, useTokenContract } from './useContract'

export function useAllTokens(otherChainId?: ChainId, onChainId?: ChainId): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React();
  let realChainId = chainId;
  if(onChainId) realChainId = onChainId;
  const userAddedTokens = useUserAddedTokens()
  const allTokens = useSelectedTokenList()
  let filteredTokens: { [tokenAddress: string]: WrappedTokenInfo } ;
  if(otherChainId && realChainId){
    const namesToFilter = Object.values(allTokens[otherChainId]).map(tokenInfo => tokenInfo.name);
    // get only common tokens on both chains
    let tempFilteredTokens = Object.entries(allTokens[realChainId]).filter(([address, token]) => namesToFilter.includes(token.name));
    filteredTokens = Object.fromEntries(tempFilteredTokens);
  } else if(realChainId) filteredTokens = allTokens[realChainId];
  return useMemo(() => {
    if (!realChainId) return {}
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<{ [address: string]: Token }>(
          (tokenMap, token) => {
            tokenMap[token.address] = token
            return tokenMap
          },
          // must make a copy because reduce modifies the map, and we do not
          // want to make a copy in every iteration
          { ...filteredTokens }
        )
    )
  }, [realChainId, userAddedTokens, allTokens])
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency): boolean {
  const userAddedTokens = useUserAddedTokens()
  return !!userAddedTokens.find(token => currencyEquals(currency, token))
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/
function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : bytes32 && BYTES32_REGEX.test(bytes32)
    ? parseBytes32String(bytes32)
    : defaultValue
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string, onChainId?: ChainId): Token | undefined | null {
  const { chainId } = useActiveWeb3React();
  let realChainId = chainId;
  if(onChainId) realChainId = onChainId;
  const tokens = useAllTokens(undefined, realChainId)

  const address = isAddress(tokenAddress)

  const tokenContract = useTokenContract(address ? address : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)

  return useMemo(() => {
    if (token) return token
    if (!realChainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        realChainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
      )
    }
    return undefined
  }, [
    address,
    realChainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result
  ])
}

export function useCurrency(currencyId: string | undefined, onChainId?: ChainId): Currency | null | undefined {
  const isETH = currencyId?.toUpperCase() === 'ETH'
  const token = useToken(isETH ? undefined : currencyId, onChainId)
  return isETH ? ETHER : token
}
