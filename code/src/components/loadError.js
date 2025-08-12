import React from 'react';
import { Button, ButtonText, Center, Heading, HStack, Icon, Text, ButtonIcon } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// custom components and helper files
import { getTermFromDictionary } from '../translations/TranslationService';
import { ThemeContext } from '../context/initialContext';

/**
 * Catch an error and display it to the user
 * <ul>
 *     <li>error - The error array that contains title and message objects</li>
 *     <li>reloadAction - The name of the component that would result in a reload of the screen (optional)</li>
 * </ul>
 * @param {string} error
 * @param {string} reloadAction
 **/
export function loadError(error, reloadAction = '') {
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);

     return (
          <Center flex={1}>
               <HStack>
                    <Icon as={MaterialIcons} name="error" size="md" mr="$1" color={theme['colors']['error']['500']} />
                    <Heading color={theme['colors']['error']['500']} mb="$2">
                         {getTermFromDictionary('en', 'error')}
                    </Heading>
               </HStack>
               <Text bold w="75%" textAlign="center" color={textColor}>
                    {getTermFromDictionary('en', 'error_loading_results')}
               </Text>
               {reloadAction ? (
                    <Button mt="$5" colorScheme="primary" onPress={reloadAction} bgColor={theme['colors']['primary']['500']}>
                         <ButtonIcon><Icon as={MaterialIcons} name="refresh" size="sm" color={theme['colors']['primary']['500-text']} /></ButtonIcon>
                         <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'button_reload')}</ButtonText>
                    </Button>
               ) : null}
               <Text size="xs" w="75%" mt="$5" color={theme['colors']['muted']['500']} textAlign="center">
                    ERROR: {error}
               </Text>
          </Center>
     );
}

/**
 * Display a toast if Aspen LiDA is unable to connect to the server when fetching data
 **/
export function badServerConnectionToast() {
     const toast = useToast();
     return toast.show({
          title: getTermFromDictionary('en', 'error_no_server_connection'),
          description: getTermFromDictionary('en', 'error_no_library_connection'),
          status: 'error',
          isClosable: true,
          duration: 5000,
          accessibilityAnnouncement: getTermFromDictionary('en', 'error_no_library_connection'),
          zIndex: 9999,
          placement: 'top',
     });
}

/**
 * <b>Toast: low priority messages</b>
 *
 * <ul>
 * <li>Use Case: A brief error or update regarding an app process</li>
 * <li>User Action: Optional and minimal</li>
 * <li>Closes On: Disappears automatically, should be brief</li>
 * <li>Example Use: Bad API fetches or server connection troubles/timeouts</li>
 * </ul>
 * - - - -
 * Available statuses:
 * <ul>
 * <li>Success</li>
 * <li>Error</li>
 * <li>Info</li>
 * <li>Warning</li>
 * </ul>
 * @param {string} title
 * @param {string} description
 * @param {string} status
 **/
export function popToast(title, description, status) {
     Toast.show({
          position: 'bottom',
          type: status,
          text1: title,
          text2: description,
     });
}

/**
 * <b>Alert: prominent, medium priority messages</b>
 *
 * <ul>
 * <li>Use Case: An error or notice occurs because of an action that a user has taken</li>
 * <li>User Action: Optional, buttons do not need to be displayed</li>
 * <li>Closes On: When dismissed or the state that caused the alert is resolved</li>
 * <li>Example Use: Checkout renewal, freeze or thaw hold, or hold cancelled</li>
 * </ul>
 * - - - -
 * Available statuses:
 * <ul>
 * <li>Success</li>
 * <li>Error</li>
 * <li>Info</li>
 * </ul>
 * @param {string} title
 * @param {string} description
 * @param {string} status
 **/
export function popAlert(title, description, status) {
     Toast.show({
          position: 'bottom',
          type: status,
          text1: title,
          text2: description,
     });
}
