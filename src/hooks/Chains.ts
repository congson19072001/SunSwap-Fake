import { useMemo } from "react";
import { ChainSelect } from "../connectors";
import { CHAIN_SUPPORTED, MUMBAI_CHAIN } from "../constants";

export function useAllChains(){
    const chains: ChainSelect[] = useMemo(() => {
        return Object.values(CHAIN_SUPPORTED).map(([chain]) => {
            return {
                chainId: chain.chainId,
                img: chain.img,
                name: chain.name
            };
        });
    }, []);
    return chains;
}

export function useChain(chainId: string | undefined): ChainSelect | null | undefined {
    const isMumbai = chainId === '80001';
    let chain: ChainSelect | undefined = undefined;
    if (chainId) {
        const chains = Object.values(CHAIN_SUPPORTED).find(([chain]) => chain.chainId === Number(chainId));
        chain = chains ? chains[0] : undefined;
    }
    return isMumbai ? MUMBAI_CHAIN : chain
  }
  