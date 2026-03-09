import { create } from 'apisauce';
import _ from 'lodash';
import {
     Button,
     ButtonText,
     ButtonGroup,
     Center,
     FormControl,
     FormControlLabel,
     Input,
     InputField,
     Modal,
     ModalContent,
     ModalBody,
     ModalHeader,
     Heading,
     ModalCloseButton,
     ModalFooter,
     Text,
     ModalBackdrop, Icon, CloseIcon,
     FormControlLabelText
} from '@gluestack-ui/themed';
import React from 'react';
import { loadingSpinner } from '../../components/loadingSpinner';
import { LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import { getTermFromDictionary, getTranslationsWithValues } from '../../translations/TranslationService';
import { createAuthTokens, getErrorMessage, getHeaders, postData, stripHTML } from '../../util/apiAuth';
import { GLOBALS } from '../../util/globals';
import { LIBRARY } from '../../util/loadLibrary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logDebugMessage } from '../../util/logging';

export const ResetPassword = (props) => {
     const { library } = React.useContext(LibrarySystemContext)
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const { ils, forgotPasswordType, usernameLabel, passwordLabel, showForgotPasswordModal, setShowForgotPasswordModal } = props;
     const [isProcessing, setIsProcessing] = React.useState(false);
     const [isLoading, setIsLoading] = React.useState(false);

     const language = 'en';
     let libraryUrl = library.baseUrl ?? LIBRARY.url;

     const [buttonLabel, setButtonLabel] = React.useState('Forgot PIN?');
     const [modalTitle, setModalTitle] = React.useState('Forgot PIN');
     const [modalButtonLabel, setModalButtonLabel] = React.useState('Reset My PIN');
     const [resetBody, setResetBody] = React.useState('To reset your PIN, enter your card number or your email address.  You must have an email associated with your account to reset your PIN.  If you do not, please contact the library.');

     React.useEffect(() => {
          setIsLoading(true);

          async function fetchTranslations() {
               await getTranslationsWithValues('forgot_password_link', passwordLabel, language, libraryUrl).then((result) => {
                    let term = _.toString(result);
                    if (!term.includes('%')) {
                         setButtonLabel(term);
                    }
               });
               await getTranslationsWithValues('forgot_password_title', passwordLabel, language, libraryUrl).then((result) => {
                    let term = _.toString(result);
                    if (!term.includes('%')) {
                         setModalTitle(term);
                    }
               });
               await getTranslationsWithValues('reset_my_password', passwordLabel, language, libraryUrl).then((result) => {
                    let term = _.toString(result);
                    if (!term.includes('%')) {
                         setModalButtonLabel(term);
                    }
               });
               if (ils === 'koha') {
                    await getTranslationsWithValues('koha_password_reset_body', [_.lowerCase(passwordLabel), _.lowerCase(usernameLabel)], language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
               } else if (ils === 'sirsi' || ils === 'horizon') {
                    await getTranslationsWithValues('sirsi_password_reset_body', _.lowerCase(passwordLabel), language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
               } else if (ils === 'evergreen') {
                    await getTranslationsWithValues('evergreen_password_reset_body', _.lowerCase(passwordLabel), language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
               } else if (ils === 'millennium') {
                    await getTranslationsWithValues('millennium_password_reset_body', [_.lowerCase(usernameLabel), _.lowerCase(passwordLabel)], language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
                    await getTranslationsWithValues('request_pin_reset', passwordLabel, language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setModalButtonLabel(term);
                         }
                    });
               } else if (ils === 'symphony') {
                    await getTranslationsWithValues('symphony_password_reset_body', _.lowerCase(usernameLabel), language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
               } else {
                    await getTranslationsWithValues('aspen_password_reset_body', [_.lowerCase(passwordLabel), _.lowerCase(usernameLabel)], language, libraryUrl).then((result) => {
                         let term = _.toString(result);
                         if (!term.includes('%')) {
                              setResetBody(term);
                         }
                    });
               }
               setIsLoading(false);
          }

          fetchTranslations();
     }, [language, libraryUrl]);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
     };

     if (isLoading) {
          return null;
     }

     return (
          <Center>
               <Button variant="link" onPress={() => setShowForgotPasswordModal(true)}>
                    <ButtonText style={ buttonLabel.length > 80 ? {fontSize: 12} : undefined} color={theme['colors']['primary']['500']}>{buttonLabel}</ButtonText>
               </Button>
               <Modal isOpen={showForgotPasswordModal} size="lg" avoidKeyboard={true} onClose={() => setShowForgotPasswordModal(false)}>
                    <ModalBackdrop />
                    <ModalContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{modalTitle}</Heading>
                              <ModalCloseButton hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>

                         {isLoading ? (
                              <ModalBody>{loadingSpinner()}</ModalBody>
                         ) : ils === 'koha' && forgotPasswordType === 'emailResetLink' ? (
                              <KohaResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor}/>
                         ) : ils === 'sirsi' && forgotPasswordType === 'emailResetLink' ? (
                              <SirsiResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : ils === 'horizon' && forgotPasswordType === 'emailResetLink' ? (
                              <SirsiResetPassword libraryUrl={libraryUrl} sernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : ils === 'evergreen' && forgotPasswordType === 'emailResetLink' ? (
                              <EvergreenResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : ils === 'millennium' && forgotPasswordType === 'emailResetLink' ? (
                              <MillenniumResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : ils === 'symphony' && forgotPasswordType === 'emailResetLink' ? (
                              <SymphonyResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : forgotPasswordType === 'emailAspenResetLink' ? (
                              <AspenResetPassword libraryUrl={libraryUrl} usernameLabel={usernameLabel} passwordLabel={passwordLabel} modalButtonLabel={modalButtonLabel} resetBody={resetBody} setShowForgotPasswordModal={setShowForgotPasswordModal} isProcessing={isProcessing} setIsProcessing={setIsProcessing} theme={theme} colorMode={colorMode} textColor={textColor} />
                         ) : null}
                    </ModalContent>
               </Modal>
          </Center>
     );
};

const AspenResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [username, setUsername] = React.useState('');

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, '', false, 'aspen', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          if (_.isEmpty(results.success) && results.error) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.error)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                                   <Button onPress={resetWindow} bgColor={theme['colors']['primary']['500']}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else if (!_.isEmpty(results.message)) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.message)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_1')}</Text>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_2')}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          }
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text color={textColor}>{resetBody}</Text>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                    </FormControl>
                    <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                         <InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="done" enterKeyHint="done" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => initiateResetPassword()} textContentType="username" color={textColor} />
                    </Input>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

const KohaResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [email, setEmail] = React.useState('');
     const [username, setUsername] = React.useState('');
     const [resend, setResend] = React.useState(false);

     const fieldRef = React.useRef();

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, email, resend, 'koha', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          if (_.isEmpty(results.success) && results.error) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.error)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                                   <Button bgColor={theme['colors']['primary']['500']} onPress={resetWindow}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else if (!_.isEmpty(results.message)) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.message)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_1')}</Text>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_2')}</Text>
                              <Center>
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        size="sm"
                                        onPress={() => {
                                             setResend(true);
                                             initiateResetPassword();
                                        }}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'resend_email')}</ButtonText>
                                   </Button>
                              </Center>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          }
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text mb="$2" color={textColor}>{resetBody}</Text>
                    <FormControl mb="$2">
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="next" enterKeyHint="next" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => fieldRef.current.focus()} blurOnSubmit={false} textContentType="username" color={textColor}/></Input>
                    </FormControl>
                    <FormControl mb="$2">
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{getTermFromDictionary('en', 'patron_email')}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="email" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" enterKeyHint="done" returnKeyType="done" onChangeText={(text) => setEmail(text)} textContentType="emailAddress" ref={fieldRef} onSubmitEditing={() => initiateResetPassword()} color={textColor} /></Input>
                    </FormControl>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

const SirsiResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [username, setUsername] = React.useState('');

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, '', false, 'sirsi', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          if (_.isEmpty(results.success) && results.error) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.error)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                                   <Button bgColor={theme['colors']['primary']['500']} onPress={resetWindow}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else if (!_.isEmpty(results.message)) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.message)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_1')}</Text>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_2')}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          }
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text color={textColor}>{resetBody}</Text>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="done" enterKeyHint="done" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => initiateResetPassword()} textContentType="username" color={textColor} /></Input>
                    </FormControl>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

const EvergreenResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [email, setEmail] = React.useState('');
     const [username, setUsername] = React.useState('');
     const [resend, setResend] = React.useState(false);

     const fieldRef = React.useRef();

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, email, resend, 'evergreen', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          if (_.isEmpty(results.success) && results.error) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.error)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                                   <Button bgColor={theme['colors']['primary']['500']} onPress={resetWindow}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else if (!_.isEmpty(results.message)) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.message)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_1')}</Text>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_2')}</Text>
                              <Center>
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        size="sm"
                                        onPress={() => {
                                             setResend(true);
                                             initiateResetPassword();
                                        }}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'resend_email')}</ButtonText>
                                   </Button>
                              </Center>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          }
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text color={textColor}>{resetBody}</Text>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="next" enterKeyHint="next" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => fieldRef.current.focus()} blurOnSubmit={false} textContentType="username" color={textColor}/></Input>
                    </FormControl>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{getTermFromDictionary('en', 'patron_email')}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField  id="email" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" enterKeyHint="done" returnKeyType="done" onChangeText={(text) => setEmail(text)} textContentType="emailAddress" ref={fieldRef} onSubmitEditing={() => initiateResetPassword()} color={textColor}/></Input>
                    </FormControl>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

const SymphonyResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [username, setUsername] = React.useState('');

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, '', false, 'symphony', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          if (_.isEmpty(results.success) && results.error) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.error)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                                   <Button bgColor={theme['colors']['primary']['500']} onPress={resetWindow}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else if (!_.isEmpty(results.message)) {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{stripHTML(results.message)}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          } else {
               return (
                    <>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_1')}</Text>
                              <Text color={textColor}>{getTermFromDictionary('en', 'password_reset_success_body_2')}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup space="$2">
                                   <Button variant="link" onPress={closeWindow}>
                                        <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </>
               );
          }
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text color={textColor}>{resetBody}</Text>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="done" enterKeyHint="done" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => initiateResetPassword()} textContentType="username" color={textColor} /></Input>
                    </FormControl>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

const MillenniumResetPassword = (props) => {
     const { usernameLabel, setShowForgotPasswordModal, isProcessing, setIsProcessing, modalButtonLabel, resetBody, libraryUrl, textColor, theme, colorMode } = props;
     const [username, setUsername] = React.useState('');

     const [showResults, setShowResults] = React.useState(false);
     const [results, setResults] = React.useState('');
     const [hasError, setHasError] = React.useState(false);

     const closeWindow = () => {
          setShowForgotPasswordModal(false);
          setIsProcessing(false);
          setShowResults(false);
          setResults('');
          setHasError(false);
     };
     const initiateResetPassword = async () => {
          setIsProcessing(true);
          await resetPassword(username, '', false, 'millennium', libraryUrl).then((response) => {
               if(response.ok) {
                    setResults(response.data.result);
                    setShowResults(true);
                    setHasError(false);
               } else {
                    logDebugMessage("Error initiating reset password");
                    logDebugMessage(response);
                    setHasError(true);
                    const error = getErrorMessage(response.code ?? 0, response.problem);
                    setResults(error.message);
                    setShowResults(true);
               }
          });
          setIsProcessing(false);
     };

     const resetWindow = () => {
          setShowResults(false);
          setResults('');
          setHasError(false);
     };

     if (results && showResults && !hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results.message)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'button_ok')}</ButtonText>
                              </Button>
                              {!_.isEmpty(results.error) ? (
                                   <Button bgColor={theme['colors']['primary']['500']} onPress={resetWindow}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'try_again')}</ButtonText>
                                   </Button>
                              ) : null}
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     if(showResults && hasError) {
          return (
               <>
                    <ModalBody>
                         <Text color={textColor}>{stripHTML(results)}</Text>
                    </ModalBody>
                    <ModalFooter>
                         <ButtonGroup space="$2">
                              <Button variant="link" onPress={closeWindow}>
                                   <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </>
          );
     }

     return (
          <>
               <ModalBody>
                    <Text color={textColor}>{resetBody}</Text>
                    <FormControl>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="username" variant="filled" autoCorrect={false} autoCapitalize="none" size="$xl" returnKeyType="done" enterKeyHint="done" onChangeText={(text) => setUsername(text)} onSubmitEditing={() => initiateResetPassword()} textContentType="username"color={textColor}/></Input>
                    </FormControl>
               </ModalBody>
               <ModalFooter>
                    <ButtonGroup space="$2">
                         <Button variant="link" onPress={closeWindow}>
                              <ButtonText color={textColor}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
                         </Button>
                         <Button isLoading={isProcessing} isLoadingText={getTermFromDictionary('en', 'button_processing', true)} bgColor={theme['colors']['primary']['500']} onPress={initiateResetPassword}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{modalButtonLabel}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </ModalFooter>
          </>
     );
};

async function resetPassword(username = '', email = '', resendEmail = false, ils = null, url) {
     const postBody = await postData();
     let params = {};
     if (ils === 'koha') {
          params = {
               username: username,
               email: email,
               resendEmail: resendEmail,
          };
     } else if (ils === 'sirsi') {
          params = {
               barcode: username,
          };
     } else if (ils === 'evergreen' || ils === 'horizon') {
          params = {
               username: username,
               email: email,
               resendEmail: resendEmail,
          };
     } else if (ils === 'millennium') {
          params = {
               barcode: username,
          };
     } else if (ils === 'symphony') {
          params = {
               barcode: username,
          };
     } else {
          params = {
               reset_username: username,
          };
     }

     const discovery = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
     });
     return await discovery.get('/UserAPI?method=resetPassword', params);
}
