import { useState } from 'react'

import { isAddress } from 'utils'
import { useTokenContract } from 'hooks/token/useToken'

export function useTokenBalance(address: string): number | undefined {
  const tokenContract = useTokenContract()
  const [balance, setBalance] = useState(undefined)
  if (tokenContract && isAddress(address)) {
    tokenContract
      .balanceOf(address)
      .then((balance) => {
        setBalance(Number(balance) / 10 ** 18)
      })
      .catch((e) => {
        console.error('Web3 error', e)
      })
  }
  return balance
}
