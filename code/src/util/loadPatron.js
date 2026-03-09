import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';
import _ from 'lodash';

// custom components and helper files
import { createAuthTokens, getErrorMessage, getHeaders, postData } from './apiAuth';
import { GLOBALS } from './globals';
import { LIBRARY } from './loadLibrary';
import { popToast } from '../components/loadError';
import { logErrorMessage } from './logging';

export const PATRON = {
     userToken: null,
     scope: null,
     library: null,
     location: null,
     listLastUsed: null,
     fines: 0,
     messages: [],
     num: {
          checkedOut: 0,
          holds: 0,
          lists: 0,
          overdue: 0,
          ready: 0,
          savedSearches: 0,
          updatedSearches: 0,
     },
     promptForOverdriveEmail: 1,
     rememberHoldPickupLocation: 0,
     pickupLocations: [],
     language: 'en',
     coords: {
          lat: null,
          long: null,
     },
     linkedAccounts: [],
     holds: [],
     lists: [],
     browseCategories: [],
     sublocations: [],
     hideSoftDeleteListUI: false,
};

export async function getILSMessages(url) {
     let baseUrl = url ?? LIBRARY.url;
     const postBody = await postData();
     const api = create({
          baseURL: baseUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     return await api.post('/UserAPI?method=getILSMessages', postBody);
}

export async function getBrowseCategoryListForUser(url = null) {
     const postBody = await postData();
     let baseUrl = url ?? LIBRARY.url;
     const discovery = create({
          baseURL: baseUrl,
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               checkIfValid: false,
          },
     });
     return await discovery.post('/API/SearchAPI?method=getBrowseCategoryListForUser', postBody);
}

export async function updateBrowseCategoryStatus(id, url = null, hide = 'single') {
     const postBody = await postData();
     let baseUrl = url ?? LIBRARY.url;
     const discovery = create({
          baseURL: baseUrl,
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          params: { browseCategoryId: id, hide },
          auth: createAuthTokens(),
     });
     return await discovery.post('/API/UserAPI?method=updateBrowseCategoryStatus', postBody);
}
