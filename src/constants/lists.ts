// the Sunswap Default token list lives here
import dotenv from 'dotenv';
dotenv.config();
export const DEFAULT_TOKEN_LIST_URL = process.env.DEFAULT_TOKEN_LIST_URL ?? 'ipfs://QmdSTgiyAwD5hWLDq6tTyea7ke27Hz1bPfRQq3eNseoq3D'

export const DEFAULT_LIST_OF_LISTS: string[] = [DEFAULT_TOKEN_LIST_URL]
