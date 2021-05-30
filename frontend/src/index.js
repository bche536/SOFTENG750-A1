import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppContextProvider } from './AppContextProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import dayjs from 'dayjs';
import DayjsUtils from '@date-io/dayjs';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Auth0Provider } from '@auth0/auth0-react';

const relativeTime = require('dayjs/plugin/relativeTime');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

require('dotenv').config();

ReactDOM.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    redirectUri={window.location.origin}
  >
    {console.log(domain)}
    <MuiPickersUtilsProvider utils={DayjsUtils}>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </MuiPickersUtilsProvider>
  </Auth0Provider>,
  document.getElementById('root')
);

// Change to "register()" to enable service workers (production only)
serviceWorkerRegistration.unregister();
