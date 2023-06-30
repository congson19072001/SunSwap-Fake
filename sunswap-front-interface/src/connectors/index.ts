import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { ChainId } from 'sunswap-sdk'

// import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
// const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '80001')

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { 
    [NETWORK_CHAIN_ID]: NETWORK_URL,
    [ChainId.POLYGON]: "https://polygon-rpc.com",
    [ChainId.BINANCE_TESTNET]: "https://data-seed-prebsc-1-s1.binance.org:8545",
    [ChainId.BINANCE]: "https://bsc.publicnode.com",
    [ChainId.MAINNET]: "https://ethereum.publicnode.com",
    [ChainId.GÖRLI]: "https://ethereum-goerli.publicnode.com"
    
  },
  defaultChainId: NETWORK_CHAIN_ID
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any, "any"))
}

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 80001, 97, 56]
})

export interface ChainSelect {
  chainId: number
  img: string
}
// type IAllowedNetwork = '0x89' | '0x13881'

export async function requestSwitchNetwork(chainId: number) {
  const chainIdHex = `0x${chainId.toString(16)}` // as IAllowedNetwork
  const provider = (window as any)?.ethereum

  if (provider) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      // if (switchError.code === 4902) {
      //   try {
      //     await provider.request({
      //       method: 'wallet_addEthereumChain',
      //       params: [NETWORKS[chainIdHex]],
      //     });
      //   } catch (addError) {
      //     console.log({ addError });
      //   }
      // }
    }
  }
}

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: { 80001: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 5000
})

// // mainnet only
// export const fortmatic = new FortmaticConnector({
//   apiKey: FORMATIC_KEY ?? '',
//   chainId: 80001
// })

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1, 5]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'Sunswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
