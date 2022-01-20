import { INFURA_ID } from './index'

export default Object.freeze({
  mainnet: {
    name: 'Ethereum',
    image: '/images/eth.svg',
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    blockExplorer: 'https://etherscan.io/',
  },
  kovan: {
    name: 'Kovan Testnet',
    image: '/images/eth-black.svg',
    chainId: 42,
    rpcUrl: `https://kovan.infura.io/v3/${INFURA_ID}`,
    faucet: 'https://ethdrop.dev/',
    blockExplorer: 'https://kovan.etherscan.io/',
  },
  matic: {
    name: 'Polygon',
    image: '/images/matic.svg',
    networkName: 'Matic(Polygon) Mainnet',
    currencySymbol: 'MATIC',
    chainId: 137,
    rpcUrl: 'https://rpc-mainnet.matic.network',
    faucet: 'https://faucet.matic.network/',
    blockExplorer: 'https://polygonscan.com',
  },
  mumbai: {
    name: 'Mumbai Testnet',
    image: '/images/matic-black.svg',
    networkName: 'Matic(Polygon) Testnet Mumbai',
    currencySymbol: 'tMATIC',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.matic.today',
    faucet: 'https://faucet.matic.network/',
    blockExplorer: 'https://mumbai.polygonscan.com/',
  },
})
