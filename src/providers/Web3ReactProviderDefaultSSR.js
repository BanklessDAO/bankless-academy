import { createWeb3ReactRoot } from '@web3-react/core'

import { DefaultProviderName } from 'constants'

const Web3ReactProviderDefault = createWeb3ReactRoot(DefaultProviderName)

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const Web3ReactProviderDefaultSSR = ({ children, getLibrary }) => {
  return (
    <Web3ReactProviderDefault getLibrary={getLibrary}>
      {children}
    </Web3ReactProviderDefault>
  )
}

export default Web3ReactProviderDefaultSSR
