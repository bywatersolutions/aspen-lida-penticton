import { create } from 'apisauce';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { Box, FlatList, Center, Heading } from 'native-base';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadError } from '../../components/loadError';

// custom components and helper files
import { LoadingSpinner } from '../../components/loadingSpinner';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext } from '../../context/initialContext';
import { createAuthTokens, getHeaders } from '../../util/apiAuth';
import { GLOBALS } from '../../util/globals';
import { DisplayResult } from './DisplayResult';
import { logDebugMessage, logErrorMessage } from '../../util/logging';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { DisplaySystemMessage } from '../../components/Notifications';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const SearchResultsForList = () => {
     const id = useRoute().params?.id;

     const navigation = useNavigation();
     const prevRoute = useRoute().params?.prevRoute ?? 'HomeScreen';
     const screenTitle = useRoute().params?.title ?? '';
     const [page, setPage] = React.useState(1);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const url = library.baseUrl;

     let isUserList = false;
     if (screenTitle.includes('Your List')) {
          isUserList = true;
     }

     const systemMessagesForScreen = [];

     React.useEffect(() => {
          if (_.isArray(systemMessages)) {
               systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0') {
                         systemMessagesForScreen.push(obj);
                    }
               });
          }
     }, [systemMessages]);

     const { status, data, error, isFetching, isPreviousData } = useQuery({
          queryKey: ['searchResultsForList', url, page, id, language],
          queryFn: () => fetchSearchResults(id, page, url, language),
          keepPreviousData: true,
          staleTime: 1000,
          onError: (error) => {
               logDebugMessage("Error searching by list");
               logErrorMessage(error);
          }
     });

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     const NoResults = () => {
          return (
               <>
                    {_.size(systemMessagesForScreen) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
                    <Center flex={1}>
                         <Heading pt="$5" color={textColor}>{getTermFromDictionary(language, 'no_results')}</Heading>
                    </Center>
               </>
          );
     };

     return (
          <SafeAreaView style={{ flex: 1 }}>
               {_.size(systemMessagesForScreen) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
               {status === 'loading' || isFetching ? (
                    LoadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <Box flex={1}>
                         <FlatList data={data.items} ListEmptyComponent={NoResults} renderItem={({ item }) => <DisplayResult data={item} />} keyExtractor={(item, index) => index.toString()} />
                    </Box>
               )}
          </SafeAreaView>
     );
};

async function fetchSearchResults(id, page, url, language) {
     let listId = id;
     if (_.isString(listId)) {
          if (listId.includes('system_user_list')) {
               const myArray = id.split('_');
               listId = myArray[myArray.length - 1];
          }
     }

     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });

     const response = await api.get('/SearchAPI?method=getListResults', {
          id: listId,
          limit: 25,
          page: page,
          language,
     });

     if (!response.ok || !response.data) {
          logErrorMessage(response);
     }

     return {
          id: response.data.result?.id ?? listId,
          items: Object.values(response.data.result?.items),
     };
}
