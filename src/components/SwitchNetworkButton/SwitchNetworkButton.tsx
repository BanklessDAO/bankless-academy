import React, { useEffect, useState } from 'react'
import { Image, Select } from '@chakra-ui/react'
import networks from 'constants/networks'
import switchNetwork from './switchNetwork'
import handleNetworkChange from './handleNetworkChange'

const SwitchNetworkButton = ({ isMobile }: { isMobile: boolean }): any => {
  const [network, setNetwork] = useState(networks.mainnet)

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const networkName = event.target.value
    await switchNetwork(networkName.toLowerCase(), setNetwork)
  }

  useEffect(() => {
    const metamask = window.ethereum
    if (metamask) {
      handleNetworkChange(metamask, setNetwork)
    }
  }, [])

  return (
    <div>
      <Select
        size={isMobile ? 'sm' : 'md'}
        onChange={handleChange}
        value={network.name}
        icon={<Image src={network.image} />}
      >
        <option value={networks.mainnet.name}>{networks.mainnet.name}</option>
        <option value={networks.kovan.name}>{networks.kovan.name}</option>
        <option value={networks.matic.name}>{networks.matic.name}</option>
        <option value={networks.mumbai.name}>{networks.mumbai.name}</option>
      </Select>
    </div>
  )
}

export default SwitchNetworkButton