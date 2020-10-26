import React from 'react'
import ReactDOM from 'react-dom'
import './css/tailwind.out.css'
import 'typeface-inter'
import 'typeface-ibm-plex-mono'

import StablecoinApp from './StablecoinApp'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
  <React.StrictMode>
    <StablecoinApp />
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
