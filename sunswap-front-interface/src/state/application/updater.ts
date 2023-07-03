import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'
import store from '..';
import { network } from '../../connectors'
import { ethers } from 'ethers';



export default function Updater(): null {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch();
  const otherChainId = Number(store.getState()?.bridge?.OUTPUT?.chainId);
  let provider: ethers.providers.JsonRpcProvider;
  if(otherChainId && otherChainId > 0) {
    provider = new ethers.providers.JsonRpcProvider(network.providerOf(otherChainId).url);
  }

  

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null
  })

  const [otherState, setOtherState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId: otherChainId,
    blockNumber: null
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState(state => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      });
      
    },
    [chainId, setState]
  )

  const otherBlockNumberCallback = useCallback(
    () => {
      if(otherChainId && otherChainId > 0) {
        
        provider = new ethers.providers.JsonRpcProvider(network.providerOf(otherChainId).url);
        provider.getBlockNumber().then(otherBlockNumber => {
          setOtherState(otherState => {
            if (chainId === state.chainId) {
              if (typeof otherState.blockNumber !== 'number') return { chainId: otherChainId, blockNumber: otherBlockNumber }
              return { chainId: otherChainId, blockNumber: Math.max(otherBlockNumber, otherState.blockNumber) }
            }
            return otherState
          })
        })
      }
    },
    [setOtherState, otherChainId]
  )

  // attach/detach listeners
  useEffect(() => {
    if (!library || !chainId || !windowVisible) return undefined

    setState({ chainId, blockNumber: null })

    if(otherChainId && otherChainId > 0) setOtherState({ chainId: otherChainId, blockNumber: null })

    library
      .getBlockNumber()
      .then(blockNumberCallback)
      .then(otherBlockNumberCallback)
      .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error))
    library.on('block', blockNumberCallback)
    return () => {
      library.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, otherChainId, library, blockNumberCallback, windowVisible])

  const debouncedState = useDebounce(state, 100)
  const debouncedOtherState = useDebounce(otherState, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return;
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }));
    if(debouncedOtherState.chainId && debouncedOtherState.chainId > 0 && debouncedOtherState.blockNumber)
    dispatch(updateBlockNumber({ chainId: debouncedOtherState.chainId, blockNumber: debouncedOtherState.blockNumber }));
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId, debouncedOtherState.chainId])

  return null
}
