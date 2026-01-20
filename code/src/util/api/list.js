import { create } from 'apisauce';
import _ from 'lodash';
import { popAlert, popToast } from '../../components/loadError';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { createAuthTokens, ENDPOINT, getErrorMessage, getHeaders, postData } from '../apiAuth';
import { GLOBALS } from '../globals';
import { PATRON } from '../loadPatron';
import { logErrorMessage } from '../logging';

const endpoint = ENDPOINT.list;

/**
 * Returns array of basic details about a given user list
 * @param {array} id
 * @param {string} url
 **/
export async function getListDetails(id, url) {
     const postBody = await postData();
     const discovery = create({
          baseURL: url,
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(endpoint.isPost),
          params: { id: id },
          auth: createAuthTokens(),
     });
     const response = await discovery.post(`${endpoint.url}getListDetails`, postBody);
     if (response.ok) {
          return response.data?.result ?? [];
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return [];
     }
}

/**
 * Returns all lists for a given user
 * @param {string} url
 **/
export async function getLists(url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     return await api.post('/ListAPI?method=getUserLists&checkIfValid=false', postBody);
}

export function formatLists(data) {
     let lists = [];
     if (!_.isUndefined(data.lists)) {
          lists = _.sortBy(data.lists, ['title']);
     }
     PATRON.lists = lists;
     return lists;
}

/**
 * Create a new list for a user
 * @param {string} title
 * @param {string} description
 * @param {boolean} isPublic
 * @param {string} url
 * @param {string} addToListGroup
 * @param {int} addToListGroupNestedId
 * @param {string} addToListGroupNewName
 * @param {int} existingListId
 **/
export async function createList(title, description, isPublic = false, url, addToListGroup, addToListGroupNestedId, addToListGroupNewName, existingListId) {
     const postBody = await postData();
     const discovery = create({
          baseURL: url,
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               title,
               description,
               isPublic,
               addToListGroupOption: addToListGroup,
               addToListGroupNested: addToListGroupNestedId === '' ? existingListId : addToListGroupNestedId,
               addToListGroupNewName: addToListGroupNewName,
          },
     });
     const response = await discovery.post(`${endpoint.url}createList`, postBody);
     console.log(response);
     if (response.ok) {
          if (response.data.result.listId) {
               PATRON.listLastUsed = response.data.result.listId;
          }
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return false;
     }
}

export async function createListFromTitle(title, description, access, items, url, source = 'GroupedWork', addToListGroup, addToListGroupNestedId, addToListGroupNewName) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               title,
               description,
               access,
               source,
               recordIds: items,
               addToListGroupOption: addToListGroup,
               addToListGroupNested: addToListGroupNestedId,
               addToListGroupNewName: addToListGroupNewName,
          },
     });
     const response = await api.post('/ListAPI?method=createList', postBody);
     if (response.ok) {
          if (response.data.result.listId) {
               PATRON.listLastUsed = response.data.result.listId;
          }

          let status = 'success';
          let alertTitle = 'Success';
          if (!response.data.result.success) {
               status = 'danger';
               alertTitle = 'Error';
          }

          if (response.data.result.numAdded) {
               popAlert(alertTitle, response.data.result.numAdded + ' added to ' + title, status);
          } else {
               popAlert(alertTitle, 'Title added to ' + title, status);
          }
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return false;
     }
}

export async function editList(listId, title, description, access, url, listGroupId = null) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               id: listId,
               title,
               description,
               public: access,
               listGroupId
          },
     });
     const response = await api.post('/ListAPI?method=editList', postBody);
     if (response.ok) {
          PATRON.listLastUsed = listId;
          return response.data;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function addTitlesToList(id, itemId, url, source = 'GroupedWork', language = 'en') {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               listId: id,
               recordIds: itemId,
               source,
          },
     });
     const response = await api.post('/ListAPI?method=addTitlesToList', postBody);
     if (response.ok) {
          PATRON.listLastUsed = id;
          if (response.data.result.success) {
               popAlert(getTermFromDictionary(language, 'added_successfully'), response.data.result.numAdded + ' added to list', 'success');
          } else {
               popAlert(getTermFromDictionary(language, 'error'), 'Unable to add item to list', 'error');
          }
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function getListTitles(id, url, page, pageSize = 20, numTitles = 25, sort = 'dateAdded') {
     let morePages = false;
     let totalResults = 0;
     let curPage = page;
     let totalPages = 0;
     let titles = [];
     let message = null;

     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               id: id,
               page: page,
               pageSize: pageSize,
               numTitles: numTitles,
               sort_by: sort,
          },
     });
     const response = await api.post('/ListAPI?method=getListTitles', postBody);
     if (response.ok) {
          const data = response.data;
          morePages = true;
          if (data.result?.page_current === data.result?.page_total) {
               morePages = false;
          }
          titles = data.result?.titles ?? [];
          totalResults = data.result?.totalResults ?? 0;
          curPage = data.result?.page_current ?? 0;
          totalPages = data.result?.page_total ?? 0;
          message = data.result?.message ?? null;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          message = error.message;
     }

     return {
          listTitles: titles,
          totalResults: totalResults,
          curPage: curPage,
          totalPages: totalPages,
          hasMore: morePages,
          sort: sort,
          message: message,
     };
}

export async function removeTitlesFromList(listId, title, url, source) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               listId,
               source,
               recordIds: title,
          },
     });
     const response = await api.post('/ListAPI?method=removeTitlesFromList', postBody);
     if (response.ok) {
          PATRON.listLastUsed = listId;
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function deleteList(listId, url, optOutOfSoftDeletion = false) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               id: listId,
               optOutOfSoftDeletion: optOutOfSoftDeletion
          },
     });
     const response = await api.post('/ListAPI?method=deleteList', postBody);
     if (response.ok) {
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

/**
 * Returns all list groups for a given user
 * @param {string} url
 **/
export async function getListGroups(url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     return await api.post('/ListAPI?method=getUserListGroups', postBody);
}

/**
 * Returns details about a given list group
 * @param {int} listGroupId
 * @param {string} url
 **/
export async function getListGroupDetails(listGroupId, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               groupId: listGroupId
          },
     });
     return await api.post('/ListAPI?method=getListGroupDetails', postBody);
}

/**
 * Creates a list group for a user
 * @param {string} title
 * @param {int} nestedGroupId
 * @param {string} url
 **/
export async function createListGroup(title, nestedGroupId, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               title: title,
               nestedGroupId: nestedGroupId
          },
     });
     return await api.post('/ListAPI?method=createListGroup', postBody);
}

/**
 * Deletes the given list group for a user
 * @param {int} listGroupId
 * @param {string} url
 **/
export async function deleteListGroup(listGroupId, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               groupId: listGroupId
          },
     });
     return await api.post('/ListAPI?method=deleteListGroup', postBody);
}

/**
 * Edits the title for a given list group
 * @param {int} listGroupId
 * @param {string} newTitle
 * @param {string} url
 **/
export async function editListGroup(listGroupId, newTitle, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               groupId: listGroupId,
               listGroupNameNew: newTitle
          },
     });
     return await api.post('/ListAPI?method=editListGroup', postBody);
}

/**
 * Edits the parent list group for a given list group
 * @param {int} listGroupId
 * @param {int} newParentListGroupId
 * @param {string} url
 **/
export async function editListGroupParent(listGroupId, newParentListGroupId, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               groupId: listGroupId,
               listGroupMove: newParentListGroupId
          },
     });
     return await api.post('/ListAPI?method=editListGroupParent', postBody);
}
