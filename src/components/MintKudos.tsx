/* eslint-disable no-console */
import { useState, useEffect } from 'react'
import { Button, Link } from '@chakra-ui/react'
import { isMobile } from 'react-device-detect'
import axios from 'axios'
const btoa = function (str) {
  return Buffer.from(str).toString('base64')
}

import { useActiveWeb3React } from 'hooks'
import switchNetwork from 'components/SwitchNetworkButton/switchNetwork'

const MINTKUDOS_API = process.env.NEXT_PUBLIC_MINTKUDOS_API
const IS_MINTKUDOS_SANDBOX =
  MINTKUDOS_API === 'https://sandbox-api.mintkudos.xyz'
const MINTKUDOS_COMMUNITY_ID = process.env.NEXT_PUBLIC_MINTKUDOS_COMMUNITY_ID
const MINTKUDOS_KEY = process.env.NEXT_PUBLIC_MINTKUDOS_KEY
const encodedString = btoa(MINTKUDOS_COMMUNITY_ID + ':' + MINTKUDOS_KEY)
const tokenId = 582

const MintKudos = (): React.ReactElement => {
  const [isKudosClaimed, setIsKudosClaimed] = useState(false)

  const { account, library, chainId } = useActiveWeb3React()

  const hostname = window?.location.hostname

  useEffect(() => {
    axios
      .get(`${MINTKUDOS_API}/v1/wallets/${account}/tokens`)
      .then(function (res) {
        if (res.data?.data?.some((k) => k?.kudosTokenId === tokenId))
          setIsKudosClaimed(true)
        // TODO: store in localStorage also
      })
      .catch(function (error) {
        console.error(error)
      })
  }, [account])

  const signMessage = async () => {
    if (isKudosClaimed) return
    // TODO: make this dynamic -> lesson.mintKudosTokenId

    const types = {
      Claim: [{ name: 'tokenId', type: 'uint256' }],
    }

    // The data to sign
    const value = {
      tokenId: tokenId,
    }
    const domainInfo = {
      name: 'Kudos',
      version: '7',
      // Mumbai | Polygon
      chainId: IS_MINTKUDOS_SANDBOX ? 80001 : 137,
      verifyingContract: IS_MINTKUDOS_SANDBOX
        ? '0xB876baF8F69cD35fb96A17a599b070FBdD18A6a1'
        : '0x60576A64851C5B42e8c57E3E4A5cF3CF4eEb2ED6',
    }

    try {
      const signer = library.getSigner(account)
      const signature = await signer._signTypedData(domainInfo, types, value)
      console.log('signature', signature)
      const bodyParameters = {
        claimingAddress: account,
        signature: signature,
      }
      const config = {
        headers: {
          Authorization: `Basic ${encodedString}`,
        },
      }
      // TODO: move this to the backend to keep the API KEY secure + check that the quest has been validated before
      const result = await axios.post(
        `${MINTKUDOS_API}/v1/tokens/${tokenId}/claim`,
        bodyParameters,
        config
      )
      console.log(result)
      console.log(result.data)
      // TODO: check header/Location to check when the token has been claimed
      if (result) setIsKudosClaimed(true)
    } catch (error) {
      // TODO: add error feedback
      console.error(error)
    }
  }

  const signatureButton = () => (
    <>
      <Button
        colorScheme={isKudosClaimed ? 'green' : 'red'}
        onClick={signMessage}
        variant="primary"
      >
        {isKudosClaimed ? 'Kudos claimed 🎉' : 'Claim your Kudos 🎉'}
      </Button>
      {isMobile && (
        <p>
          * if you have trouble signing on mobile, we recommend to open this
          website directly inside&nbsp;
          <Link href={`https://metamask.app.link/dapp/${hostname}`} color="red">
            MetaMask&apos;s browser
          </Link>
        </p>
      )}
    </>
  )

  const networkSwitchButton = () => (
    <>
      <Button
        colorScheme={isKudosClaimed ? 'green' : 'red'}
        onClick={() => switchNetwork('mumbai')}
      >
        Switch Network to {'"Matic(Polygon) Testnet Mumbai"'}
      </Button>
      {isMobile && (
        <p>
          * network switching with your mobile wallet only works if you open
          this website directly inside&nbsp;
          <strong>MetaMask&apos;s browser</strong>
        </p>
      )}
    </>
  )

  return <>{chainId === 80001 ? signatureButton() : networkSwitchButton()}</>
}

export default MintKudos
