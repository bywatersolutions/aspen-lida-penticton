import React from 'react';
import _ from 'lodash';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';

import { loadingSpinner } from '../../components/loadingSpinner';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getSelfRegistrationForm, submitSelfRegistration } from '../../util/api/library';
import { ThemeContext } from '../../context/initialContext';

import { ScrollView, Box, Button, ButtonGroup, ButtonText, FormControl, FormControlHelper, FormControlHelperText, Icon, Input, Text, Select, SelectTrigger, SelectInput, SelectIcon, ChevronDownIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, CheckIcon, FormControlLabel, FormControlLabelText, InputField } from '@gluestack-ui/themed';

export const SelfRegistration = () => {
	const {theme, textColor, colorMode} = React.useContext(ThemeContext);
	const route = useRoute();
	const navigation = useNavigation();
	const libraryUrl = route?.params?.libraryUrl ?? '';
	const [isLoading, setIsLoading] = React.useState(true);
	const [fields, setFields] = React.useState([]);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [valuesToSubmit, setValuesToSubmit] = React.useState([]);
	const [values, setValues] = React.useState([]);
	const [showResults, setShowResults] = React.useState(false);
	const [results, setResults] = React.useState('');

	React.useEffect(() => {
		(async () => {
			await getSelfRegistrationForm(libraryUrl).then((fields) => {
				setFields(fields);
				let object = {};
				_.map(fields, function(section, index, collection) {
					const properties = section.properties;
					_.forEach(properties, function (field, key) {
						let prop = field.property;
						const property = {
							[prop]: '',
						};
						_.merge(object, property);
					});
				});
				setValues(object);
			});
			setIsLoading(false);
		})();
	}, []);

	const handleInputChange = (index, value) => {
		let tmp = values;
		tmp[index] = value;
		setValuesToSubmit(tmp);
	}

	const getFields = () => {
		if(_.size(fields) > 0) {
			return (
				<>
					{_.map(fields, function(section, index, collection) {
						const {label, properties} = section;
						return (
							<Box mb="$5">
							<Text bold fontSize="$md" color={textColor}>{label}</Text>
							{_.map(properties, function(field, key) {
							const {type, description, maxLength, required, property} = field;
							const fieldLabel = field.label;
							if (type === 'text') {
								return (
									<FormControl my="$2" isRequired={required}>
										<FormControlLabel><FormControlLabelText color={textColor}>{fieldLabel}</FormControlLabelText></FormControlLabel>
										<Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField type='text'
										                   key={key}
										                   name={property}
										                   maxLength={maxLength ? parseInt(maxLength) : undefined}
										                   accessibilityLabel={description}
										                   returnKeyType="next"
										                   color={textColor}
										                   onChangeText={(value) => {
											                   console.log(property, value);
											                   handleInputChange(property, value);
										                   }}/></Input>
										{!_.isEmpty(description) ? (
											<FormControlHelper>
												<FormControlHelperText>
													{description}
												</FormControlHelperText>
											</FormControlHelper>
										) : null}
									</FormControl>
								)
							} else if (type === 'password') {
								return (
									<FormControl my="$2" isRequired={required}>
										<FormControlLabel><FormControlLabelText color={textColor}>{fieldLabel}</FormControlLabelText></FormControlLabel>
										<Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField type='password'
										                   key={property}
										                   name={property}
										                   maxLength={maxLength ? parseInt(maxLength) : undefined}
										                   accessibilityLabel={description}
										                   color={textColor}
										                   onChangeText={(value) => {
											                   handleInputChange(property, value);
										                   }}/>
										</Input>
										{!_.isEmpty(description) ? (
											<FormControlHelper>
												<FormControlHelperText>
													{description}
												</FormControlHelperText>
											</FormControlHelper>
										) : null}
									</FormControl>
								)
							}  else if (type === 'email') {
								return (
									<FormControl my="$2" isRequired={required}>
										<FormControlLabel><FormControlLabelText color={textColor}>{fieldLabel}</FormControlLabelText></FormControlLabel>
										<Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}><InputField type='email'
										                   key={property}
										                   name={property}
										                   maxLength={maxLength ? parseInt(maxLength) : undefined}
										                   accessibilityLabel={description}
										                   color={textColor}
										                   onChangeText={(value) => {
											                   handleInputChange(property, value);
										                   }} /></Input>
										{!_.isEmpty(description) ? (
											<FormControlHelper>
												<FormControlHelperText>
													{description}
												</FormControlHelperText>
											</FormControlHelper>
										) : null}
									</FormControl>
								)
							} else if (type === 'enum') {
								const values = field.values ?? {};
								return (
									<FormControl my="$2" isRequired={required}>
										<FormControlLabel><FormControlLabelText color={textColor}>{fieldLabel}</FormControlLabelText></FormControlLabel>
										<Select
											name={property}
											accessibilityLabel={description}
											onValueChange={(value) => {
												handleInputChange(property, value);
											}}
										>
											<SelectTrigger variant="outline" size="md">
												<SelectInput placeholder="Select option" color={textColor}/>
												<SelectIcon mr="$3">
													<Icon as={ChevronDownIcon} color={textColor}/>
												</SelectIcon>
											</SelectTrigger>
											<SelectPortal>
												<SelectBackdrop />
												<SelectContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
											{_.map(values, function (item, index, array) {
												return <SelectItem key={index} value={index} label={item} bgColor={property === index ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: property === index ? theme['colors']['tertiary']['500-text'] : textColor } }} />;
											})}
												</SelectContent>
											</SelectPortal>
										</Select>
										{!_.isEmpty(description) ? (
                                                       <FormControlHelper>
                                                            <FormControlHelperText>
                                                                 {description}
                                                            </FormControlHelperText>
                                                       </FormControlHelper>
										) : null}
									</FormControl>
								)
							}
						})}
							</Box>
						)
					})}
				</>
			)
		}

		return null;
	}

	const handleSubmission = async () => {
		await submitSelfRegistration(libraryUrl, valuesToSubmit).then((result) => {
			setResults(result);
			if(result) {
				setShowResults(true);
			}
			setIsSubmitting(false);
		});
	};

	return (
		<>
			{isLoading ? (
				loadingSpinner()
			) : (
				<ScrollView>
					<Box p="$3">
						{!showResults ? (
							<Text mb="$3" color={textColor}>{getTermFromDictionary('en', 'self_registration_message')}</Text>
						) : null}
						{showResults ? (
							<>
								{results.success === true ? (
									<Text mb="$3" color={textColor}>{getTermFromDictionary('en', 'self_registration_success')}</Text>
								) : (
									<Text mb="$3" color={textColor}>{getTermFromDictionary('en', 'self_registration_error')}</Text>
								)}

								{results.message ? (
									<Text mb="$3" color={textColor}>{results.message}</Text>
								) : null}

								{results.barcode ? (
									<Text mb="$3" color={textColor}>Your library card is <Text bold color={textColor}>{results.barcode}</Text></Text>
								) : null}

								{results.username ? (
									<Text mb="$3" color={textColor}>Your username is <Text bold color={textColor}>{results.username}</Text></Text>
								) : null}

								{results.password ? (
									<Text mb="$3" color={textColor}>Your initial password is <Text bold color={textColor}>{results.password}</Text></Text>
								) : null}

								{results.requirePinReset ? (
									<Text mb="$3" color={textColor}>To login to the catalog, you must reset your PIN.</Text>
								) : null}

								<Button borderColor={theme['colors']['secondary']['500']} variant="outline" onPress={() => {
									navigation.goBack();
									setShowResults(false);
									setResults('');
								}}>
									<ButtonText color={theme['colors']['secondary']['500']}>{getTermFromDictionary('en', 'close_window')}</ButtonText>
								</Button>
							</>
						) : (
							<>
								{getFields()}
								<ButtonGroup pt="$3" pb="$5">
									<Button
										bgColor={theme['colors']['secondary']['500']}
										isLoading={isSubmitting}
										isLoadingText="Registering..."
										onPress={() => {
											setIsSubmitting(true);
											handleSubmission();
										}}>
										<ButtonText color={theme['colors']['secondary']['500-text']}>{getTermFromDictionary('en', 'register')}</ButtonText>
									</Button>
									<Button borderColor={theme['colors']['secondary']['500']} variant="outline" onPress={() => navigation.goBack()}>
										<ButtonText color={theme['colors']['secondary']['500']}>{getTermFromDictionary('en', 'cancel')}</ButtonText>
									</Button>
								</ButtonGroup>
							</>
						)}
					</Box>
				</ScrollView>
			)}
		</>
	);
};
