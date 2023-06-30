import { useMemo } from "react";
import { ChainSelect } from "../connectors";
import { ChainId } from "sunswap-sdk";
import { MUMBAI_CHAIN } from "../constants";

export function useAllChains(){
    const chains: ChainSelect[] = useMemo(() => {
        const chain_ids = Object.values(ChainId).filter(id =>  typeof id === "number").map(id => Number(id));
        return chain_ids.map(id => ({
            chainId: id,
            img: ""
        }))
    }, []);
    return chains
}

export function useChain(chainId: string | undefined): ChainSelect | null | undefined {
    const isMumbai = chainId === '80001'
    const chain: ChainSelect | undefined = chainId ? {
        chainId: Number(chainId),
        img: ""
    } : undefined
    return isMumbai ? MUMBAI_CHAIN : chain
  }
  