/* eslint-disable no-await-in-loop */
import axios from 'axios'
import bigInt from 'big-integer'
import { RippleAPI } from 'ripple-lib'
import { BigNumber } from 'bignumber.js'

BigNumber.set({ DECIMAL_PLACES: 10, ROUNDING_MODE: 4 })

const testnetFaucetAddress = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'

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

export const enableRippling = async (
  genesisAddress: string,
  genesisSecret: string,
): Promise<void> => {
  const preppedSettings = await api.prepareSettings(genesisAddress, {
    defaultRipple: true,
  })
  const submittedSettings = await api.submit(
    api.sign(preppedSettings.txJSON, genesisSecret).signedTransaction,
  )
  console.log('Submitted Set Default Ripple', submittedSettings)
}

export const openTrustline = async (
  sourceAddress: string,
  sourceSecret: string,
  genesisAddress: string,
  currency: string,
): Promise<void> => {
  const preparedTrustline = await api.prepareTrustline(sourceAddress, {
    currency,
    counterparty: genesisAddress,
    limit: '100000',
    ripplingDisabled: false,
  })

  const signature = api.sign(preparedTrustline.txJSON, sourceSecret)
    .signedTransaction

  const submitResponse = await api.submit(signature)

  console.log('Trustline Submit Response', submitResponse)
}

export const issueTokens = async (
  genesisAddress: string,
  genesisSecret: string,
  destinationAddress: string,
  currency: string,
  value: string,
  adjustmentRate: number,
): Promise<void> => {
  const adjustedValue = new BigNumber(value)
    .dividedBy(adjustmentRate)
    .toString()
  const preparedTokenIssuance = await api.preparePayment(genesisAddress, {
    source: {
      address: genesisAddress,
      maxAmount: {
        value: adjustedValue,
        currency,
        counterparty: genesisAddress,
      },
    },
    destination: {
      address: destinationAddress,
      amount: {
        value: adjustedValue,
        currency,
        counterparty: genesisAddress,
      },
    },
  })
  const issuanceResponse = await api.submit(
    api.sign(preparedTokenIssuance.txJSON, genesisSecret).signedTransaction,
  )

  console.log('Issuance Submition Response', issuanceResponse)
}

interface TokenSend {
  sourceAddress: string
  sourceSecret: string
  destinationAddress: string
  genesisAddress: string
  currency: string
  value: string
  adjustmentRate: number
}

export const sendTokens = async (data: TokenSend): Promise<void> => {
  const value = new BigNumber(data.value)
    .dividedBy(data.adjustmentRate)
    .toString()
  const preparedTokenPayment = await api.preparePayment(data.sourceAddress, {
    source: {
      address: data.sourceAddress,
      maxAmount: {
        value,
        currency: data.currency,
        counterparty: data.genesisAddress,
      },
    },
    destination: {
      address: data.destinationAddress,
      amount: {
        value,
        currency: data.currency,
        counterparty: data.genesisAddress,
      },
    },
  })
  const tokenPaymentResponse = await api.submit(
    api.sign(preparedTokenPayment.txJSON, data.sourceSecret).signedTransaction,
  )

  console.log('Token Payment Response', tokenPaymentResponse)
}

export const hexToUtf8 = (hex: string): string => {
  return decodeURIComponent(`%${hex.match(/.{1,2}/g)?.join('%')}`)
}

export const setDailyInterestRate = async (
  genesisAddress: string,
  genesisSecret: string,
  rate: string,
): Promise<void> => {
  const preparedAdjustmentRatePayment = await api.preparePayment(
    genesisAddress,
    {
      source: {
        address: genesisAddress,
        maxAmount: {
          value: '1',
          currency: 'drops',
        },
      },
      destination: {
        address: testnetFaucetAddress,
        amount: {
          value: '1',
          currency: 'drops',
        },
      },
      memos: [
        {
          data: `dailyInterestRate=${rate}`,
        },
      ],
    },
  )

  const adjustmentRatePaymentResponse = await api.submit(
    api.sign(preparedAdjustmentRatePayment.txJSON, genesisSecret)
      .signedTransaction,
  )

  console.log('Adjustment Payment Response', adjustmentRatePaymentResponse)
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

    // Request our current balance
    let currentBalance
    try {
      currentBalance = bigInt(accountInfo.xrpBalance)
    } catch {
      currentBalance = bigInt('0')
    }
    // If our current balance has changed then return
    if (startingBalance.notEquals(currentBalance)) {
      console.log('Funded by faucet:', accountInfo)
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
