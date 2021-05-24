import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppContextProvider } from './AppContextProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import dayjs from 'dayjs'
import DayjsUtils from '@date-io/dayjs';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

const relativeTime = require('dayjs/plugin/relativeTime');
const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

ReactDOM.render(
  <MuiPickersUtilsProvider utils={DayjsUtils}>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </MuiPickersUtilsProvider>,
  document.getElementById('root')
);

// Change to "register()" to enable service workers (production only)
serviceWorkerRegistration.unregister();
