import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import _ from 'lodash';
import moment from 'moment';
import { Box, Button, ButtonText, ButtonIcon, Center, HStack, VStack, Icon, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Text, Heading, ModalBackdrop, CloseIcon, ModalCloseButton } from '@gluestack-ui/themed';
import React from 'react';
import { Dimensions } from 'react-native';
import Barcode from 'react-native-barcode-expo';
import { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

// custom components and helper files
import { PermissionsPrompt } from '../../../components/PermissionsPrompt';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary, getTranslationsWithValues } from '../../../translations/TranslationService';
import { getLinkedAccounts, updateScreenBrightnessStatus } from '../../../util/api/user';
import { formatDiscoveryVersion } from '../../../util/loadLibrary';

export const MyLibraryCard = () => {
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const [isLoading, setLoading] = React.useState(true);
     const [shouldRequestPermissions, setShouldRequestPermissions] = React.useState(false);
     const [previousBrightness, setPreviousBrightness] = React.useState();
     const [brightnessMode, setBrightnessMode] = React.useState(1);
     const [isLandscape, setIsLandscape] = React.useState(false);
     const { user, accounts, updateLinkedAccounts, cards, updateLibraryCards } = React.useContext(UserContext);
     //const [numCards, setNumCards] = React.useState(_.size(cards) ?? 1);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { theme } = React.useContext(ThemeContext);

     let autoRotate = library.generalSettings?.autoRotateCard ?? 0;

     /*     async function changeScreenOrientation(isLandscape) {
	 console.log("changeScreenOrientation > " + isLandscape);
	 await ScreenOrientation.unlockAsync().then(async result => {
	 if (isLandscape) {
	 await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
	 } else {
	 await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
	 }
	 }
	 )
	 } */

     useQuery(['linked_accounts', user, cards, library.baseUrl, language], () => getLinkedAccounts(user, cards, library.barcodeStyle, library.baseUrl, language), {
          initialData: accounts,
          onSuccess: (data) => {
               updateLinkedAccounts(data.accounts);
               updateLibraryCards(data.cards);
          },
          placeholderData: [],
     });

     const updateStatus = async () => {
          await updateScreenBrightnessStatus(false, library.baseUrl, language);
          queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
     };

     React.useEffect(() => {
          const updateAccounts = navigation.addListener('focus', async () => {
               queryClient.invalidateQueries({ queryKey: ['linked_accounts', library.baseUrl, language] });
          });
          const brightenScreen = navigation.addListener('focus', async () => {
               const { status } = await Brightness.getPermissionsAsync();
               if (status === 'undetermined') {
                    if (!_.isUndefined(user.shouldAskBrightness) && (user.shouldAskBrightness === 1 || user.shouldAskBrightness === '1')) {
                         setShouldRequestPermissions(true);
                    }
               } else {
                    if (status === 'granted') {
                         await Brightness.getBrightnessAsync().then((level) => {
                              console.log('Storing previous screen brightness for later: ' + level);
                              setPreviousBrightness(level);
                         });
                         await Brightness.getSystemBrightnessModeAsync().then((mode) => {
                              console.log('Storing system brightness mode for later: ' + mode);
                              setBrightnessMode(mode);
                         });
                         console.log('Updating screen brightness');
                         Brightness.setSystemBrightnessAsync(1);
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                         setShouldRequestPermissions(false);
                    } else {
                         // we were denied permissions
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                         setShouldRequestPermissions(false);
                         console.log('Unable to update screen brightness');
                    }
               }
          });
          const updateOrientation = navigation.addListener('focus', async () => {
               if (autoRotate === '1' || autoRotate === 1) {
                    await ScreenOrientation.unlockAsync();
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
                    setIsLandscape(true);
               } else {
                    const result = await ScreenOrientation.getOrientationAsync();
                    if (result === 5 || result === 6 || result === 7) {
                         setIsLandscape(true);
                    } else {
                         setIsLandscape(false);
                    }
               }
          });
          const changeOrientation = ScreenOrientation.addOrientationChangeListener(({ orientationInfo, orientationLock }) => {
               switch (orientationInfo.orientation) {
                    case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
                    case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
                    case ScreenOrientation.Orientation.LANDSCAPE:
                         console.log('Screen orientation changed to landscape');
                         setIsLandscape(true);
                         break;
                    default:
                         console.log('Screen orientation changed to portrait');
                         setIsLandscape(false);
                         break;
               }
          });
          return { updateAccounts, brightenScreen, updateOrientation, changeOrientation };
     }, [navigation]);

     React.useEffect(() => {
          navigation.addListener('blur', () => {
               (async () => {
                    const { status } = await Brightness.getPermissionsAsync();
                    if (status === 'granted' && previousBrightness) {
                         console.log('Restoring previous screen brightness');
                         Brightness.setSystemBrightnessAsync(previousBrightness);
                         console.log('Restoring system brightness');
                         Brightness.restoreSystemBrightnessAsync();
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                    }
                    if (status === 'granted' && brightnessMode) {
                         console.log('Restoring brightness mode');
                         let mode = 'BrightnessMode.MANUAL';
                         if (brightnessMode === 1) {
                              mode = 'BrightnessMode.AUTOMATIC';
                         }
                         Brightness.setSystemBrightnessModeAsync(brightnessMode);
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                    }
                    console.log('navigationListener isLandscape > ' + isLandscape);
                    if (isLandscape) {
                         console.log('Restoring screen back to portrait mode');
                         await ScreenOrientation.unlockAsync().then(async () => {
                              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                         });
                    }
               })();
          });
          return () => {};
     }, [navigation, previousBrightness, isLandscape]);

     if (shouldRequestPermissions) {
          return <PermissionsPrompt promptTitle="permissions_screen_brightness_title" promptBody="permissions_screen_brightness_body" setShouldRequestPermissions={setShouldRequestPermissions} updateStatus={updateStatus} />;
     }

     const version = formatDiscoveryVersion(library.discoveryVersion);
     let shouldShowAlternateLibraryCard = false;
     if (typeof library.showAlternateLibraryCard !== 'undefined') {
          shouldShowAlternateLibraryCard = library.showAlternateLibraryCard;
     }
     if (version >= '24.09.00' && (shouldShowAlternateLibraryCard === '1' || shouldShowAlternateLibraryCard === 1)) {
          shouldShowAlternateLibraryCard = true;
     } else {
          shouldShowAlternateLibraryCard = false;
     }

     /* useFocusEffect(
	 React.useCallback(() => {
	 console.log("numCards listener > " + numCards);
	 console.log("isLandscape listener > " + isLandscape);
	 if(numCards <= 1 && !isLandscape) {
	 toggleOrientation();
	 }

	 if(numCards > 1 && isLandscape) {
	 toggleOrientation();
	 }
	 return () => {};
	 }, [numCards])
	 ) */

     /*     const toggleOrientation = () => {
	 setIsLandscape(!isLandscape)
	 changeScreenOrientation(!isLandscape)
	 } */

     /*if (isLoading) {
	 return loadingSpinner();
	 }*/

     //MaterialCommunityIcons = phone-rotate-landscape
     return (
          <>
               <CardCarousel cards={cards} orientation={isLandscape} />
               {shouldShowAlternateLibraryCard ? (
                    <Center mb="$3">
                         <Button
                              size="md"
                              bgColor={theme['colors']['secondary']['500']}
                              onPress={() => {
                                   navigateStack('LibraryCardTab', 'MyAlternateLibraryCard', {
                                        prevRoute: 'MyLibraryCard',
                                        hasPendingChanges: false,
                                   });
                              }}>
                              <ButtonText color={theme['colors']['secondary']['500-text']}>{getTermFromDictionary(language, 'manage_alternate_library_card')}</ButtonText>
                         </Button>
                    </Center>
               ) : null}
          </>
     );
};

const CreateLibraryCard = (data) => {
     const card = data.card ?? [];
     const { numCards } = data ?? 0;

     const [expirationText, setExpirationText] = React.useState('');
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);

     let barcodeStyle;
     if (!_.isUndefined(card.barcodeStyle) && !_.isNull(card.barcodeStyle)) {
          barcodeStyle = _.toString(card.barcodeStyle);
     } else {
          barcodeStyle = _.toString(library.barcodeStyle);
     }

     let barcodeValue = 'UNKNOWN';
     if (!_.isUndefined(card.ils_barcode)) {
          barcodeValue = card.ils_barcode;
     } else if (!_.isUndefined(card.cat_username)) {
          barcodeValue = card.cat_username;
     }

     let expirationDate = null;
     if (!_.isUndefined(card.expires) && !_.isNull(card.expires)) {
          if (_.isString(card.expires)) {
               expirationDate = moment(card.expires, 'MMM D, YYYY');
          }

          React.useEffect(() => {
               async function fetchTranslations() {
                    console.log(card.expires);
                    await getTranslationsWithValues('library_card_expires_on', card.expires, language, library.baseUrl).then((result) => {
                         setExpirationText(result);
                    });
               }

               fetchTranslations();
          }, [language]);
     }

     let cardHasExpired = 0;
     if (!_.isUndefined(card.expired) && !_.isNull(card.expired) && card.expired !== 0 && card.expired !== '0') {
          cardHasExpired = card.expired;
     }

     let neverExpires = false;
     if (cardHasExpired === 0 && !_.isNull(expirationDate)) {
          const now = moment();
          const expiration = moment(expirationDate);
          const hasExpired = moment(expiration).isBefore(now);
          if (hasExpired) {
               neverExpires = true;
          }
     }

     let showExpirationDate = true;
     if (library.showCardExpiration === '0' || library.showCardExpiration === 0) {
          showExpirationDate = false;
     }

     let icon = library.favicon;
     if (card.homeLocation === library.displayName && library.logoApp) {
          icon = library.logoApp;
     }

     const handleBarcodeError = () => {
          barcodeStyle = 'INVALID';
     };

     if (barcodeValue === 'UNKNOWN' || _.isNull(barcodeValue) || _.isNull(barcodeStyle) || _.isEmpty(barcodeValue) || _.isEmpty(barcodeStyle) || barcodeStyle === 'INVALID' || barcodeStyle === 'none') {
          return (
               <VStack maxW="90%" px="$8" py="$5" borderRadius="$lg">
                    <Center>
                         <HStack>
                              {icon ? <Image source={{ uri: icon }} fallbackSource={require('../../../themes/default/aspenLogo.png')} alt={getTermFromDictionary(language, 'library_card')} /> : null}
                              <Text bold ml="$3" mt="$2" fontSize="$lg">
                                   {card.homeLocation}
                              </Text>
                         </HStack>
                    </Center>
                    <Center pt="$8">
                         <Text pb="$2">
                              {card.displayName}
                         </Text>
                         <Text bold fontSize="$xl">
                              {barcodeValue}
                         </Text>
                         {showExpirationDate && expirationDate && !neverExpires ? (
                              <Text fontSize="$sm">
                                   {expirationText}
                              </Text>
                         ) : null}
                    </Center>
               </VStack>
          );
     }

     let cardBg = colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700'];

     return (
          <VStack bg={cardBg} px="$8" py="$5" borderRadius="$lg" shadow="$1">
               {numCards > 1 ? (
                    <>
                         <Center>
                              <HStack>
                                   {icon ? <Image source={{ uri: icon }} fallbackSource={require('../../../themes/default/aspenLogo.png')} w={42} h={42} alt={getTermFromDictionary(language, 'library_card')} /> : null}
                                   <Text bold ml="$3" mt="$2" fontSize="$lg" color={textColor}>
                                        {card.homeLocation}
                                   </Text>
                              </HStack>
                         </Center>
                         <Center pt="$2">
                              <Text fontSize="$md" color={textColor}>
                                   {card.displayName}
                              </Text>
                         </Center>
                    </>
               ) : null}
               <Center>
                    {showExpirationDate && expirationDate && !neverExpires && numCards > 1 ? <Text color={textColor}>{expirationText}</Text> : null}
                    {numCards > 1 ? <OpenBarcode barcodeValue={barcodeValue} barcodeFormat={barcodeStyle} handleBarcodeError={handleBarcodeError} language={language} /> : <><Barcode value={barcodeValue} format={barcodeStyle} background={theme['colors']['warmGray']['200']} onError={handleBarcodeError} /><Text color={textColor} fontSize="$xl" textAlign="center">{barcodeValue}</Text></>}
                    {showExpirationDate && expirationDate && !neverExpires && numCards === 1 ? (
                         <Text color={textColor} fontSize="$sm" pt="$2">
                              {expirationText}
                         </Text>
                    ) : null}
               </Center>
          </VStack>
     );
};

const CardCarousel = (data) => {
     const { theme, textColor } = React.useContext(ThemeContext);
     const [currentIndex, setCurrentIndex] = React.useState(0);
     const cards = _.sortBy(data.cards, ['key']);
     const isVertical = data.orientation;
     const toggleOrientation = data.toggleOrientation;
     const screenWidth = Dimensions.get('window').width;
     const progressValue = useSharedValue(0);
     const ref = React.useRef();

     let baseOptions = {
          vertical: false,
          width: screenWidth,
          height: screenWidth * 0.9,
     };

     if (isVertical) {
          baseOptions = {
               vertical: true,
               width: screenWidth * 0.5,
               height: screenWidth * 0.6,
          };
     }

     const PaginationItem = (props) => {
          const { animValue, index, length, card, isRotate } = props;
          const width = 100;

          const animStyle = useAnimatedStyle(() => {
               let inputRange = [index - 1, index, index + 1];
               let outputRange = [-width, 0, width];

               if (index === 0 && animValue?.value > length - 1) {
                    inputRange = [length - 1, length, length + 1];
                    outputRange = [-width, 0, width];
               }

               return {
                    transform: [
                         {
                              translateX: interpolate(animValue?.value, inputRange, outputRange, Extrapolate.CLAMP),
                         },
                    ],
               };
          }, [animValue, index, length]);

          return (
               <Button
                    size="sm"
                    mr="$1"
                    mb="$1"
                    bgColor={index === currentIndex ? theme['colors']['tertiary']['500'] : '$none'}
                    borderColor={index === currentIndex ? 'transparent' : theme['colors']['tertiary']['500']}
                    borderWidth={index === currentIndex ? 0 : 1}
                    variant={index === currentIndex ? 'solid' : 'outline'}
                    onPress={() => {
                         ref.current.scrollTo({
                              index: index,
                              animated: true,
                         });
                    }}>
                    <ButtonText color={index === currentIndex ? theme['colors']['tertiary']['500-text'] : textColor}>{card.displayName}</ButtonText>
               </Button>
          );
     };

     if (_.size(cards) === 1) {
          const card = cards[0];
          return (
               <Box
                    p="$5"
                    flex={1}
                    alignItems="center"
                    style={{
                         transform: [{ scale: 0.9 }],
                    }}>
                    <CreateLibraryCard key={0} card={card} numCards={_.size(cards)} />
               </Box>
          );
     }

     return (
          <Box alignItems="center" px="$3">
               <Carousel
                    {...baseOptions}
                    ref={ref}
                    pagingEnabled={true}
                    snapEnabled={true}
                    autoPlay={false}
                    mode="parallax"
                    onProgressChange={(_, absoluteProgress) => (progressValue.value = absoluteProgress)}
                    onSnapToItem={(index) => setCurrentIndex(index)}
                    modeConfig={{
                         parallaxScrollingScale: 0.9,
                         parallaxScrollingOffset: 50,
                    }}
                    data={cards}
                    renderItem={({ item, index }) => <CreateLibraryCard key={index} card={item} numCards={_.size(cards)} />}
               />
               {!!progressValue && (
                    <Box flexDirection="row" flexWrap="wrap" alignContent="center" alignSelf="center" maxWidth="100%" justifyContent="center">
                         {cards.map((card, index) => {
                              return <PaginationItem card={card} animValue={progressValue} index={index} key={index} isRotate={isVertical} length={cards.length} />;
                         })}
                    </Box>
               )}
          </Box>
     );
};

const OpenBarcode = (data) => {
     const { theme } = React.useContext(ThemeContext);
     const { barcodeValue, barcodeFormat, handleBarcodeError, language } = data;
     const [showModal, setShowModal] = React.useState(false);

     const toggleModal = () => {
          setShowModal(!showModal);
     };

     return (
          <Center>
               <Button variant="link" onPress={() => toggleModal()}>
                    <ButtonIcon color={theme['colors']['primary']['500']} as={MaterialCommunityIcons} name="barcode-scan" size="lg" mr="$1" />
                    <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'open_barcode')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={() => toggleModal()} size="xl">
                    <ModalBackdrop sx={{ opacity: 0.85 }} />
                    <ModalContent bgColor="white">
                         <ModalBody bgColor="white">
							  <Barcode value={barcodeValue} format={barcodeFormat} onError={handleBarcodeError} />
                              <Center><Text fontSize="$xl" color="black">{barcodeValue}</Text></Center>
                         </ModalBody>
                    </ModalContent>
               </Modal>
          </Center>
     );
};
