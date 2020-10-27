/* eslint-disable no-await-in-loop */
import axios from 'axios'
import bigInt from 'big-integer'
import { RippleAPI } from 'ripple-lib'

export const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net:51233',
})

export const initWS = async (): Promise<boolean> => {
  try {
    await api.connect()
    return true
  } catch (error) {
    return false
  }
}

export const sleep = async (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Requests funds from the faucet to be sent to the given address
 * @param address The address we want funded
 */
export const fundFromFaucet = async (
  address: string,
  timeoutInSeconds = 20,
): Promise<void> => {
  // Balance prior to asking for more funds

  let startingBalance
  try {
    const accountInfo = await api.getAccountInfo(address)
    startingBalance = bigInt(accountInfo.xrpBalance)
  } catch {
    startingBalance = bigInt('0')
  }
  // Ask the faucet to send funds to the given address
  const faucetURL = 'https://faucet.altnet.rippletest.net/accounts'
  await axios.post(faucetURL, { destination: address })

  // Wait for the faucet to fund our account or until timeout
  // Waits one second checks if balance has changed
  // If balance doesn't change it will attempt again until timeoutInSeconds
  for (
    let balanceCheckCounter = 0;
    balanceCheckCounter < timeoutInSeconds;
    balanceCheckCounter += 1
  ) {
    // Wait 1 second
    await sleep(1000)

    // Lookup account info
    const accountInfo = await api.getAccountInfo(address).catch(() => {
      return {
        xrpBalance: '0',
      }
    })
    console.log(accountInfo)

    // Request our current balance
    let currentBalance
    try {
      currentBalance = bigInt(accountInfo.xrpBalance)
    } catch {
      currentBalance = bigInt('0')
    }
    // If our current balance has changed then return
    if (startingBalance.notEquals(currentBalance)) {
      return
    }

    // In the future if we had a tx hash from the faucet
    // We should check the status of the tx which would be more accurate
  }

  // Balance did not update
  throw new Error(
    `Unable to fund address with faucet after waiting ${timeoutInSeconds} seconds`,
  )
}
