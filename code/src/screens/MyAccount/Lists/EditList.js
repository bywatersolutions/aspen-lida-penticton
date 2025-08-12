import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, { useState } from 'react';
import { popAlert } from '../../../components/loadError';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { navigate, navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { deleteList, editList, getListDetails } from '../../../util/api/list';
import {
     AlertDialog, AlertDialogContent, AlertDialogBody, AlertDialogFooter, Text,
     Button, ButtonText, ButtonGroup,
     Pressable,
     Center, Heading, Icon, Input, InputField, Modal,
     CircleIcon, CloseIcon, ModalBackdrop, ChevronLeftIcon,
     ModalCloseButton,
     ModalContent, ModalBody, ModalFooter,
     ModalHeader,
     RadioGroup,
     Radio,
     HStack,
     RadioIcon,
     RadioIndicator,
     RadioLabel,
     TextareaInput,
     Textarea,
     FormControl,
     FormControlLabel,
     FormControlLabelText, AlertDialogBackdrop, AlertDialogCloseButton, AlertDialogHeader, ButtonIcon,
} from '@gluestack-ui/themed';

const EditList = (props) => {
     const queryClient = useQueryClient();
     const { data, listId } = props;
     const navigation = useNavigation();
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const [showModal, setShowModal] = React.useState(false);
     const [loading, setLoading] = React.useState(false);
     const [title, setTitle] = React.useState(data.title);
     const [description, setDescription] = React.useState(data.description);
     const [list, setList] = React.useState([]);
     const [isPublic, setPublic] = React.useState(data.public);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     useQuery(['list-details', data.id], () => getListDetails(data.id, library.baseUrl), {
          onSuccess: (data) => {
               setList(data);
               setLoading(false);
          },
     });

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => (
                    <Pressable
                         onPress={() => {
                              navigateStack('AccountScreenTab', 'MyLists', {
                                   hasPendingChanges: true,
                              });
                         }}
                         mr={3}
                         hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                         <ChevronLeftIcon size={5} color="primary.baseContrast" />
                    </Pressable>
               ),
          });
     }, [navigation]);

     return (
          <>
               <ButtonGroup size="sm" justifyContent="center" >
                    <Button onPress={() => setShowModal(true)} bgColor={theme['colors']['primary']['500']}>
                         <ButtonIcon color={theme['colors']['primary']['500-text']} as={MaterialIcons} name="edit" mr="$1" />
                         <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'edit')}</ButtonText>
                    </Button>
                    <DeleteList listId={listId} />
               </ButtonGroup>
               <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%" bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'edit')} {data.title}</Heading>
                              <ModalCloseButton hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'title')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField id="title" defaultValue={data.title} autoComplete="off" onChangeText={(text) => setTitle(text)} color={textColor}/></Input>
                              </FormControl>
                              <FormControl pb="$5">
                                   <FormControlLabel><FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'description')}</FormControlLabelText></FormControlLabel>
                                   <Textarea id="description" defaultValue={data.description} autoComplete="off" onChangeText={(text) => setDescription(text)}><TextareaInput color={textColor}/></Textarea>
                              </FormControl>
                              <FormControl>
                                   <FormControlLabel>
                                     <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'access')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <RadioGroup
                                        value={isPublic}
                                        onChange={(nextValue) => {
                                             setPublic(nextValue);
                                        }}>
                                        <HStack direction="row" alignItems="center" space="md" w="75%" maxW="300px">
                                             <Radio value="false" my="$1">
                                                  <RadioIndicator mr="$2"  borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'private')}</RadioLabel>
                                             </Radio>
                                             <Radio value="true" my="$1">
                                                  <RadioIndicator mr="$2"  borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'public')}</RadioLabel>
                                             </Radio>
                                        </HStack>
                                   </RadioGroup>
                              </FormControl>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={() => setShowModal(false)} borderColor={theme['colors']['primary']['500']}>
                                        <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        isLoading={loading}
                                        isLoadingText={getTermFromDictionary(language, 'saving', true)}
                                        onPress={() => {
                                             setLoading(true);
                                             editList(data.id, title, description, isPublic, library.baseUrl).then((r) => {
                                                  setLoading(false);
                                                  if (!_.isNull(title)) {
                                                       navigation.setOptions({ title: title });
                                                  }
                                                  setShowModal(false);
                                                  queryClient.invalidateQueries({ queryKey: ['list-details', data.id, library.baseUrl, language] });
                                                  queryClient.invalidateQueries({ queryKey: ['lists', user.id, library.baseUrl, language] });
                                             });
                                        }}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'save')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </>
     );
};

const DeleteList = (props) => {
     const queryClient = useQueryClient();
     const { listId } = props;
     const {theme, textColor, colorMode } = React.useContext(ThemeContext);
     const navigation = useNavigation();
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const [isOpen, setIsOpen] = React.useState(false);
     const [loading, setLoading] = useState(false);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);

     return (
          <Center>
               <Button bgColor={theme['colors']['danger']['500']} onPress={() => setIsOpen(!isOpen)} size="sm" >
                    <ButtonIcon color={theme['colors']['white']} as={MaterialIcons} name="delete" mr="$1"/>
                    <ButtonText color={theme['colors']['white']}>Delete List</ButtonText>
               </Button>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                    <AlertDialogBackdrop />
                    <AlertDialogContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                         <AlertDialogHeader>
                              <Heading size="md" color={textColor}>Delete List</Heading>
                              <AlertDialogCloseButton>
                                   <Icon as={CloseIcon} color={textColor} />
                              </AlertDialogCloseButton>
                         </AlertDialogHeader>
                         <AlertDialogBody><Text color={textColor}>Are you sure you want to delete this list?</Text></AlertDialogBody>
                         <AlertDialogFooter>
                              <ButtonGroup space="sm">
                                   <Button variant="link" onPress={onClose} ref={cancelRef}>
                                        <ButtonText color={textColor}>Cancel</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme['colors']['danger']['500']}
                                        isLoading={loading}
                                        isLoadingText="Deleting..."
                                        onPress={() => {
                                             setLoading(true);
                                             deleteList(listId, library.baseUrl).then(async (res) => {
                                                  queryClient.invalidateQueries({ queryKey: ['lists', user.id, library.baseUrl, language] });
                                                  queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                  setLoading(false);
                                                  let status = 'success';
                                                  setIsOpen(!isOpen);
                                                  if (res.success === false) {
                                                       status = 'danger';
                                                       popAlert(res.title, res.message, status);
                                                  } else {
                                                       popAlert(res.title, res.message, status);
                                                       navigateStack('AccountScreenTab', 'MyLists', {
                                                            libraryUrl: library.baseUrl,
                                                            hasPendingChanges: true,
                                                       });
                                                  }
                                             });
                                        }}>
                                        <ButtonText color={theme['colors']['white']}>Delete</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};

export default EditList;
