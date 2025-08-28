// client/components/mintingModal/ProfileImageMinter.js
import { useState, useContext } from 'react'
import { TwitterContext } from '../../context/TwitterContext'
import { useRouter } from 'next/router'
import { client } from '../../lib/client'
import { contractABI, contractAddress } from '../../lib/constants'
import { ethers } from 'ethers'
import InitialState from './InitialState'
import LoadingState from './LoadingState'
import FinishedState from './FinishedState'
import { pinJSONToIPFS, pinFileToIPFS } from '../../lib/pinata'

let metamask
if (typeof window !== 'undefined') {
  metamask = window.ethereum
}

const getEthereumContract = async () => {
  if (!metamask) {
    throw new Error('Metamask not found')
  }

  const provider = new ethers.providers.Web3Provider(metamask)

  // make sure account permission granted
  await provider.send('eth_requestAccounts', [])

  // optional: ensure Sepolia (11155111). If you want auto-switch, uncomment below.
/*
  const net = await provider.getNetwork()
  if (net.chainId !== 11155111) {
    try {
      await metamask.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia
      })
    } catch (e) {
      console.warn('Please switch MetaMask to Sepolia and retry.')
      throw e
    }
  }
*/

  const signer = provider.getSigner()

  // 🔐 ABI must be an array (list of fragments), not a big artifact object
  if (!Array.isArray(contractABI)) {
    console.error('ABI shape invalid:', contractABI)
    throw new Error('Invalid ABI: expected an array of fragments')
  }

  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  )

  return transactionContract
}

const ProfileImageMinter = () => {
  const { setAppStatus, currentAccount } = useContext(TwitterContext)
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('initial')
  const [profileImage, setProfileImage] = useState()

  const mint = async () => {
    try {
      // basic guards
      if (!name || !description || !profileImage) return
      if (!currentAccount) throw new Error('Wallet not connected')

      setStatus('loading')

      // 1) Pin the raw image to IPFS
      const pinataMetaData = { name: `${name} - ${description}` }
      const ipfsImageHash = await pinFileToIPFS(profileImage, pinataMetaData)

      // 2) Update Sanity profile first (so UI has the image even if user cancels tx)
      await client
        .patch(currentAccount)
        .set({
          profileImage: ipfsImageHash,   // store the raw image hash
          isProfileImageNft: true,
        })
        .commit()

      // 3) Create NFT metadata JSON → pin to IPFS
      const imageMetaData = {
        name,
        description,
        image: `ipfs://${ipfsImageHash}`,
      }
      const ipfsJsonHash = await pinJSONToIPFS(imageMetaData, pinataMetaData)

      // 4) Call the contract (ethers-only; NO metamask.request here)
      const contract = await getEthereumContract()
      // contract.mint(recipents, _uri)
      const tx = await contract.mint(currentAccount, `ipfs://${ipfsJsonHash}`)
      await tx.wait() // wait for confirmation

      setStatus('finished')
    } catch (error) {
      console.error('[mint error]', error)
      // You can choose 'initial' to let user retry, or 'finished' with error UI
      setStatus('initial')        // show the form again so user can retry
    }
  }

  const modalChildren = (modalStatus = status) => {
    switch (modalStatus) {
      case 'initial':
        return (
          <InitialState
            profileImage={profileImage}
            setProfileImage={setProfileImage}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            mint={mint}
          />
        )

      case 'loading':
        return <LoadingState />

      case 'finished':
        return <FinishedState />

      default:
        router.push('/')
        setAppStatus('error')
        return null
    }
  }

  return <>{modalChildren()}</>
}

export default ProfileImageMinter
