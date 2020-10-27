import React, { useEffect } from 'react'
import { api, fundFromFaucet, initWS, sleep } from './utils/xrp'

const StablecoinApp: React.FC = () => {
  useEffect(() => {
    const init = async (): Promise<void> => {
      await initWS()
      const genesisAccount = api.generateAddress({ algorithm: 'ed25519' })
      const aliceAccount = api.generateAddress({ algorithm: 'ed25519' })
      const bobAccount = api.generateAddress({ algorithm: 'ed25519' })
      if (
        genesisAccount.address &&
        aliceAccount.address &&
        bobAccount.address
      ) {
        const fundings = [
          fundFromFaucet(genesisAccount.address),
          fundFromFaucet(aliceAccount.address),
          fundFromFaucet(bobAccount.address),
        ]
        await Promise.all(fundings)

        const preppedSettings = await api.prepareSettings(
          genesisAccount.address,
          {
            defaultRipple: true,
          },
        )
        const submittedSettings = await api.submit(
          api.sign(preppedSettings.txJSON, genesisAccount.secret)
            .signedTransaction,
        )
        console.log('Submitted Set Default Ripple', submittedSettings)
        await sleep(10000)

        const trusts = [
          api.prepareTrustline(aliceAccount.address, {
            currency: 'IDK',
            counterparty: genesisAccount.address,
            limit: '100000',
            ripplingDisabled: false,
          }),
          api.prepareTrustline(bobAccount.address, {
            currency: 'IDK',
            counterparty: genesisAccount.address,
            limit: '100000',
            ripplingDisabled: false,
          }),
        ]
        const [aliceTrust, bobTrust] = await Promise.all(trusts)

        const [aliceSig, bobSig] = [
          api.sign(aliceTrust.txJSON, aliceAccount.secret).signedTransaction,
          api.sign(bobTrust.txJSON, bobAccount.secret).signedTransaction,
        ]

        const submits = [api.submit(aliceSig), api.submit(bobSig)]
        const [aliceSubmitResponse, bobSubmitResponse] = await Promise.all(
          submits,
        )

        console.log(
          'Trustline Submit Responses',
          aliceSubmitResponse,
          bobSubmitResponse,
        )

        const preparedTokenIssuance = await api.preparePayment(
          genesisAccount.address,
          {
            source: {
              address: genesisAccount.address,
              maxAmount: {
                value: '100',
                currency: 'IDK',
                counterparty: genesisAccount.address,
              },
            },
            destination: {
              address: aliceAccount.address,
              amount: {
                value: '100',
                currency: 'IDK',
                counterparty: genesisAccount.address,
              },
            },
          },
        )
        console.log('Prepared Token Issuance', preparedTokenIssuance)

        const issuanceResponse = await api.submit(
          api.sign(preparedTokenIssuance.txJSON, genesisAccount.secret)
            .signedTransaction,
        )

        console.log('Issuance Submition Response', issuanceResponse)

        await sleep(10000)

        const aliceToBobPayment = await api.preparePayment(
          aliceAccount.address,
          {
            source: {
              address: aliceAccount.address,
              maxAmount: {
                value: '1',
                currency: 'IDK',
                counterparty: genesisAccount.address,
              },
            },
            destination: {
              address: bobAccount.address,
              amount: {
                value: '1',
                currency: 'IDK',
                counterparty: genesisAccount.address,
              },
            },
          },
        )

        console.log('Prepared Alice To Bob Payment', aliceToBobPayment)

        const aliceToBobPaymentResponse = await api.submit(
          api.sign(aliceToBobPayment.txJSON, aliceAccount.secret)
            .signedTransaction,
        )

        console.log(
          'Alice To Bob Payment Submition Response',
          aliceToBobPaymentResponse,
        )
      }
    }

    init().catch((err) => console.error('Failed to init wallet', err))
  }, [])

  return <div className="min-h-screen App bg-gray-100">Hello World</div>
}

export default StablecoinApp
