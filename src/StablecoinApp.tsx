import React, { useEffect, useRef, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import classnames from 'classnames'
import {
  api,
  enableRippling,
  fundFromFaucet,
  hexToUtf8,
  initWS,
  issueTokens,
  openTrustline,
  sendTokens,
  setDailyInterestRate,
} from './utils/xrp'

const StablecoinApp: React.FC = () => {
  const [alice, setAlice] = useState<{
    address: string
    secret: string
  }>()
  const [bob, setBob] = useState<{
    address: string
    secret: string
  }>()
  const [genesis, setGenesis] = useState<{
    address: string
    secret: string
  }>()
  const currencyRef = useRef<HTMLInputElement>(null)

  const [aliceBalance, setAliceBalance] = useState<string>('0')
  const [bobBalance, setBobBalance] = useState<string>('0')
  const [genesisBalance, setGenesisBalance] = useState<string>('0')
  const [aliceTokenBalance, setAliceTokenBalance] = useState<string>('0')
  const [bobTokenBalance, setBobTokenBalance] = useState<string>('0')

  const [aliceTrustlineOpened, setAliceTrustlineOpened] = useState<boolean>(
    false,
  )
  const [bobTrustlineOpened, setBobTrustlineOpened] = useState<boolean>(false)
  const [genesisRipplingEnabled, setGenesisRipplingEnabled] = useState<boolean>(
    false,
  )

  const [currencyCodeInput, setCurrencyCodeInput] = useState<string>()
  const [currencyCode, setCurrencyCode] = useState<string>()

  const [tokenIssuanceDestination, setTokenIssuanceDestination] = useState<
    string
  >()
  const [tokenIssuanceAmount, setTokenIssuanceAmount] = useState<string>()
  const [aliceToBobValue, setAliceToBobValue] = useState<string>()
  const [bobToAliceValue, setBobToAliceValue] = useState<string>()
  const [adjustmentRate, setAdjustmentRate] = useState<number>(1)
  const [adjustmentFactorInput, setAdjustmentFactorInput] = useState<string>()

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
        setAlice({
          address: aliceAccount.address,
          secret: aliceAccount.secret,
        })
        setBob({
          address: bobAccount.address,
          secret: bobAccount.secret,
        })
        setGenesis({
          address: genesisAccount.address,
          secret: genesisAccount.secret,
        })

        await api.request('subscribe', {
          accounts: [
            genesisAccount.address,
            aliceAccount.address,
            bobAccount.address,
          ],
        })

        const fundings = [
          fundFromFaucet(genesisAccount.address),
          fundFromFaucet(aliceAccount.address),
          fundFromFaucet(bobAccount.address),
        ]
        await Promise.all(fundings)
        setAliceBalance('1000000000')
        setBobBalance('1000000000')
        setGenesisBalance('1000000000')

        api.connection.on('transaction', (event) => {
          console.log(event)

          const account = event.transaction.Account as string
          const transactionType = event.transaction.TransactionType as string
          const fee = event.transaction.Fee as string
          if (account === aliceAccount.address) {
            if (transactionType === 'TrustSet') {
              setAliceBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              setAliceTrustlineOpened(true)
            } else if (transactionType === 'Payment') {
              setAliceBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              const value = event.transaction.Amount.value as string
              setAliceTokenBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(value).toString(),
              )
              setBobTokenBalance((prevBalance) =>
                new BigNumber(prevBalance).plus(value).toString(),
              )
            }
          } else if (account === bobAccount.address) {
            if (transactionType === 'TrustSet') {
              setBobBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              setBobTrustlineOpened(true)
            } else if (transactionType === 'Payment') {
              setBobBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              const value = event.transaction.Amount.value as string
              setBobTokenBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(value).toString(),
              )
              setAliceTokenBalance((prevBalance) =>
                new BigNumber(prevBalance).plus(value).toString(),
              )
            }
          } else if (account === genesisAccount.address) {
            if (transactionType === 'AccountSet') {
              setGenesisBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              setGenesisRipplingEnabled(true)
            } else if (transactionType === 'Payment') {
              setGenesisBalance((prevBalance) =>
                new BigNumber(prevBalance).minus(fee).toString(),
              )
              const destination = event.transaction.Destination as string
              const value = event.transaction.Amount.value as string
              if (value) {
                if (destination === aliceAccount.address) {
                  setAliceTokenBalance((prevBalance) =>
                    new BigNumber(prevBalance).plus(value).toString(),
                  )
                } else if (destination === bobAccount.address) {
                  setBobTokenBalance((prevBalance) =>
                    new BigNumber(prevBalance).plus(value).toString(),
                  )
                }
              } else {
                const dailyInterestRate = hexToUtf8(
                  event.transaction.Memos[0].Memo.MemoData,
                ).split('=')[1]
                setAdjustmentRate(
                  (prevRate) => prevRate * (1 - Number(dailyInterestRate)),
                )
              }
            }
          }
        })
      }
    }

    init().catch((err) => console.error('Failed to init wallet', err))
  }, [])

  return (
    <div className="min-h-screen py-8 bg-gray-100 min-w-screen">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <ul className="grid items-start grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <li className="overflow-hidden bg-white sm:rounded-lg sm:shadow">
            <div className="px-4 py-5 bg-white border-b border-gray-200 sm:px-6">
              <div className="flex flex-wrap items-center justify-between -mt-4 -ml-4 sm:flex-no-wrap">
                <div className="mt-4 ml-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="w-12 h-12 rounded-full"
                        src="https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Alice
                      </h3>
                      <p className="text-sm leading-5 text-gray-500">
                        {api.dropsToXrp(aliceBalance)} XRP
                      </p>
                      {currencyCode && genesisRipplingEnabled && (
                        <p className="text-sm leading-5 text-gray-500">
                          {aliceTokenBalance} {currencyCode} on ledger
                        </p>
                      )}
                      {currencyCode &&
                        genesisRipplingEnabled &&
                        adjustmentRate && (
                          <p className="text-sm leading-5 text-gray-500">
                            {new BigNumber(aliceTokenBalance)
                              .times(adjustmentRate)
                              .toString()}{' '}
                            {currencyCode} Adj.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {aliceBalance === '0' && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">
                  Waiting for faucet funding...
                </p>
              </div>
            )}
            {aliceBalance !== '0' && !genesisRipplingEnabled && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">Token must be created</p>
              </div>
            )}
            {!aliceTrustlineOpened && genesisRipplingEnabled && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <span className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      if (alice && genesis && currencyCode) {
                        openTrustline(
                          alice.address,
                          alice.secret,
                          genesis.address,
                          currencyCode,
                        )
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700"
                  >
                    Open Trustline
                  </button>
                </span>
              </div>
            )}
            {aliceTokenBalance !== '0' && bobTrustlineOpened && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <label htmlFor="aliceTokenValue">
                  <span className="block text-sm font-medium leading-5 text-gray-700">
                    Send {currencyCode} to Bob
                  </span>
                  <div className="flex items-center">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        id="aliceTokenValue"
                        placeholder="Amount to send"
                        type="number"
                        onChange={(e): void => {
                          setAliceToBobValue(e.currentTarget.value)
                        }}
                        className="block w-full text-sm leading-5 form-input"
                      />
                    </div>
                    <span className="inline-flex w-auto mt-0 ml-3 rounded-md shadow-sm">
                      <button
                        onClick={() => {
                          if (
                            alice &&
                            bob &&
                            genesis &&
                            aliceToBobValue &&
                            new BigNumber(aliceTokenBalance)
                              .minus(aliceToBobValue)
                              .isGreaterThanOrEqualTo(0) &&
                            currencyCode
                          ) {
                            sendTokens({
                              sourceAddress: alice.address,
                              sourceSecret: alice.secret,
                              destinationAddress: bob.address,
                              value: aliceToBobValue,
                              currency: currencyCode,
                              genesisAddress: genesis.address,
                              adjustmentRate,
                            })
                          }
                        }}
                        disabled={
                          !aliceToBobValue ||
                          new BigNumber(aliceTokenBalance)
                            .minus(aliceToBobValue)
                            .isLessThan(0)
                        }
                        type="button"
                        className={classnames(
                          'w-full inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white focus:outline-none transition ease-in-out duration-150 text-sm leading-5',
                          {
                            'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700':
                              aliceToBobValue &&
                              new BigNumber(aliceTokenBalance)
                                .minus(aliceToBobValue)
                                .isGreaterThanOrEqualTo(0),
                            'bg-indigo-200 cursor-not-allowed':
                              !aliceToBobValue ||
                              new BigNumber(aliceTokenBalance)
                                .minus(aliceToBobValue)
                                .isLessThan(0),
                          },
                        )}
                      >
                        Send
                      </button>
                    </span>
                  </div>
                </label>
              </div>
            )}
          </li>

          <li className="overflow-hidden bg-white sm:rounded-lg sm:shadow">
            <div className="px-4 py-5 bg-white border-b border-gray-200 sm:px-6">
              <div className="flex flex-wrap items-center justify-between -mt-4 -ml-4 sm:flex-no-wrap">
                <div className="mt-4 ml-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="w-12 h-12 rounded-full"
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Bob
                      </h3>
                      <p className="text-sm leading-5 text-gray-500">
                        {api.dropsToXrp(bobBalance)} XRP
                      </p>
                      {currencyCode && genesisRipplingEnabled && (
                        <p className="text-sm leading-5 text-gray-500">
                          {bobTokenBalance} {currencyCode} on ledger
                        </p>
                      )}
                      {currencyCode &&
                        genesisRipplingEnabled &&
                        adjustmentRate && (
                          <p className="text-sm leading-5 text-gray-500">
                            {new BigNumber(bobTokenBalance)
                              .times(adjustmentRate)
                              .toString()}{' '}
                            {currencyCode} Adj.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {bobBalance === '0' && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">
                  Waiting for faucet funding...
                </p>
              </div>
            )}
            {bobBalance !== '0' && !genesisRipplingEnabled && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">Token must be created</p>
              </div>
            )}
            {!bobTrustlineOpened && genesisRipplingEnabled && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <span className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      if (bob && genesis && currencyCode) {
                        openTrustline(
                          bob.address,
                          bob.secret,
                          genesis.address,
                          currencyCode,
                        )
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700"
                  >
                    Open Trustline
                  </button>
                </span>
              </div>
            )}
            {bobTokenBalance !== '0' && aliceTrustlineOpened && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <label htmlFor="bobTokenValue">
                  <span className="block text-sm font-medium leading-5 text-gray-700">
                    Send {currencyCode} to Alice
                  </span>
                  <div className="flex items-center">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        id="bobTokenValue"
                        placeholder="Amount to send"
                        type="number"
                        onChange={(e): void => {
                          setBobToAliceValue(e.currentTarget.value)
                        }}
                        className="block w-full text-sm leading-5 form-input"
                      />
                    </div>
                    <span className="inline-flex w-auto mt-0 ml-3 rounded-md shadow-sm">
                      <button
                        onClick={() => {
                          if (
                            alice &&
                            bob &&
                            genesis &&
                            bobToAliceValue &&
                            new BigNumber(bobTokenBalance)
                              .minus(bobToAliceValue)
                              .isGreaterThanOrEqualTo(0) &&
                            currencyCode
                          ) {
                            sendTokens({
                              sourceAddress: bob.address,
                              sourceSecret: bob.secret,
                              destinationAddress: alice.address,
                              value: bobToAliceValue,
                              currency: currencyCode,
                              genesisAddress: genesis.address,
                              adjustmentRate,
                            })
                          }
                        }}
                        disabled={
                          !bobToAliceValue ||
                          new BigNumber(bobTokenBalance)
                            .minus(bobToAliceValue)
                            .isLessThan(0)
                        }
                        type="button"
                        className={classnames(
                          'w-full inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white focus:outline-none transition ease-in-out duration-150 text-sm leading-5',
                          {
                            'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700':
                              bobToAliceValue &&
                              new BigNumber(bobTokenBalance)
                                .minus(bobToAliceValue)
                                .isGreaterThanOrEqualTo(0),
                            'bg-indigo-200 cursor-not-allowed':
                              !bobToAliceValue ||
                              new BigNumber(bobTokenBalance)
                                .minus(bobToAliceValue)
                                .isLessThan(0),
                          },
                        )}
                      >
                        Send
                      </button>
                    </span>
                  </div>
                </label>
              </div>
            )}
          </li>

          <li className="overflow-hidden bg-white sm:rounded-lg sm:shadow">
            <div className="px-4 py-5 bg-white border-b border-gray-200 sm:px-6">
              <div className="flex flex-wrap items-center justify-between -mt-4 -ml-4 sm:flex-no-wrap">
                <div className="mt-4 ml-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 text-white bg-green-400 rounded-full">
                        <span className="text-xs">Genesis</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Genesis Account
                      </h3>
                      <p className="text-sm leading-5 text-gray-500">
                        {api.dropsToXrp(genesisBalance)} XRP
                      </p>
                      {currencyCode && (
                        <p className="text-sm leading-5 text-gray-500">
                          {currencyCode} Adjustment Rate: {adjustmentRate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {genesisBalance === '0' && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">
                  Waiting for faucet funding...
                </p>
              </div>
            )}
            {genesisBalance !== '0' && !genesisRipplingEnabled && (
              <div className="flex justify-center px-4 py-5 sm:px-6">
                <label htmlFor="currencyCode">
                  <span className="block text-sm font-medium leading-5 text-gray-700">
                    Currency Code
                  </span>
                  <div className="flex items-center">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        id="currencyCode"
                        placeholder="EUR"
                        maxLength={3}
                        ref={currencyRef}
                        onChange={(e): void => {
                          setCurrencyCodeInput(e.currentTarget.value)
                        }}
                        className="block w-full text-sm leading-5 form-input"
                      />
                    </div>
                    <span className="inline-flex w-auto mt-0 ml-3 rounded-md shadow-sm">
                      <button
                        onClick={() => {
                          if (genesis && currencyCodeInput?.length === 3) {
                            enableRippling(genesis.address, genesis.secret)
                            setCurrencyCode(currencyCodeInput)
                          }
                        }}
                        disabled={currencyCodeInput?.length !== 3}
                        type="button"
                        className={classnames(
                          'w-full inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white focus:outline-none transition ease-in-out duration-150 text-sm leading-5',
                          {
                            'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700':
                              currencyCodeInput?.length === 3,
                            'bg-indigo-200 cursor-not-allowed':
                              currencyCodeInput?.length !== 3,
                          },
                        )}
                      >
                        Create
                      </button>
                    </span>
                  </div>
                </label>
              </div>
            )}
            {genesisRipplingEnabled &&
              (aliceTrustlineOpened || bobTrustlineOpened) && (
                <div className="flex-col justify-center px-4 py-5 sm:px-6">
                  <div className="w-full">
                    <fieldset>
                      <legend className="block text-sm font-medium leading-5 text-gray-700">
                        Issue {currencyCode}
                      </legend>
                      <div className="mt-1 rounded-md shadow-sm">
                        <select
                          aria-label="Account to send to"
                          value={tokenIssuanceDestination}
                          className="relative block w-full transition duration-150 ease-in-out bg-transparent rounded-none form-select rounded-t-md focus:z-10 sm:text-sm sm:leading-5"
                          onChange={(e): void => {
                            setTokenIssuanceDestination(e.currentTarget.value)
                          }}
                        >
                          {aliceTrustlineOpened && <option>Alice</option>}
                          {bobTrustlineOpened && <option>Bob</option>}
                        </select>
                        <div className="-mt-px">
                          <input
                            aria-label="Token Amount"
                            className="relative block w-full transition duration-150 ease-in-out bg-transparent rounded-none form-input rounded-b-md focus:z-10 sm:text-sm sm:leading-5"
                            placeholder="Amount to send"
                            type="number"
                            onChange={(e): void => {
                              if (!tokenIssuanceDestination) {
                                setTokenIssuanceDestination(
                                  aliceTrustlineOpened ? 'Alice' : 'Bob',
                                )
                              }
                              setTokenIssuanceAmount(e.currentTarget.value)
                            }}
                          />
                        </div>
                      </div>
                    </fieldset>
                    <span className="block w-full mt-1 rounded-md shadow-sm">
                      <button
                        type="button"
                        disabled={
                          !tokenIssuanceAmount || !tokenIssuanceDestination
                        }
                        className={classnames(
                          'w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none transition duration-150 ease-in-out',
                          {
                            'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700':
                              tokenIssuanceAmount && tokenIssuanceDestination,
                            'bg-indigo-200 cursor-not-allowed':
                              !tokenIssuanceAmount || !tokenIssuanceDestination,
                          },
                        )}
                        onClick={() => {
                          if (
                            tokenIssuanceAmount &&
                            tokenIssuanceDestination &&
                            genesis &&
                            currencyCode
                          ) {
                            const address =
                              tokenIssuanceDestination === 'Alice'
                                ? alice?.address
                                : bob?.address
                            if (address) {
                              issueTokens(
                                genesis.address,
                                genesis.secret,
                                address,
                                currencyCode,
                                tokenIssuanceAmount,
                                adjustmentRate,
                              )
                            }
                          }
                        }}
                      >
                        Issue
                      </button>
                    </span>
                  </div>
                  <div className="pt-5 mt-5 border-t border-gray-200 border-1">
                    <label htmlFor="adjustmentFactor">
                      <span className="block text-sm font-medium leading-5 text-gray-700">
                        Daily interest rate
                      </span>
                      <div className="flex items-center">
                        <div className="relative rounded-md shadow-sm">
                          <input
                            id="adjustmentFactor"
                            placeholder="0.01"
                            onChange={(e): void => {
                              setAdjustmentFactorInput(e.currentTarget.value)
                            }}
                            className="block w-full text-sm leading-5 form-input"
                          />
                        </div>
                        <span className="inline-flex w-auto mt-0 ml-3 rounded-md shadow-sm">
                          <button
                            onClick={() => {
                              if (adjustmentFactorInput && genesis) {
                                setDailyInterestRate(
                                  genesis.address,
                                  genesis.secret,
                                  adjustmentFactorInput,
                                )
                              }
                            }}
                            disabled={!adjustmentFactorInput}
                            type="button"
                            className={classnames(
                              'w-full inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white focus:outline-none transition ease-in-out duration-150 text-sm leading-5',
                              {
                                'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700': adjustmentFactorInput,
                                'bg-indigo-200 cursor-not-allowed': !adjustmentFactorInput,
                              },
                            )}
                          >
                            Submit Interest
                          </button>
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default StablecoinApp
