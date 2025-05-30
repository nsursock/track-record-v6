import flatpickr from 'flatpickr';
import { fileUpload } from './components/file-upload.js';
import auth from './stores/auth.js';
import notifications from './stores/notifications.js';

// Add Alpine extensions here
document.addEventListener('alpine:init', () => {
    Alpine.data('fileUpload', fileUpload);
    Alpine.data('signupForm', () => ({
        currentStep: 1,
        formSubmitted: false,
        formData: {
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            country: null,
            city: null,
            dateOfBirth: null,
            phoneNumber: null,
            gender: null,
            linkedinHandle: null,
            twitterHandle: null,
            githubHandle: null,
            websiteUrl: null,
            profilePictureUrl: null
        },
        passwordStrength: 0,
        passwordRules: {
            minLength: false,
            hasLowercase: false,
            hasUppercase: false,
            hasNumber: false,
            hasSpecial: false
        },
        isLoading: false,
        error: null,
        fileUploadObserver: null,

        init() {
            // Initialize auth store
            auth.init();

            // Initialize any components that need it
            this.$nextTick(() => {
                if (this.$refs.dob) {
                    flatpickr(this.$refs.dob, {
                        allowInput: true,
                        monthSelectorType: 'static',
                        dateFormat: 'Y-m-d',
                        altInput: true,
                        altFormat: 'F j, Y',
                        maxDate: 'today',
                        minDate: '1900-01-01',
                        defaultDate: '2000-01-01',
                        disableMobile: true,
                        locale: {
                            firstDayOfWeek: 1
                        },
                        position: 'auto',
                        enableTime: false,
                        time_24hr: true,
                        weekNumbers: false,
                        disable: []
                    });
                }
            });
        },

        checkPasswordStrength(password) {
            this.passwordRules.minLength = password.length >= 6;
            this.passwordRules.hasLowercase = /[a-z]/.test(password);
            this.passwordRules.hasUppercase = /[A-Z]/.test(password);
            this.passwordRules.hasNumber = /[0-9]/.test(password);
            this.passwordRules.hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            // Calculate strength (0-5)
            this.passwordStrength = Object.values(this.passwordRules).filter(Boolean).length;
        },

        async submitForm() {
            this.isLoading = true;
            this.error = null;

            try {
                // Only validate required fields
                if (!this.formData.email || !this.formData.password || !this.formData.firstName || !this.formData.lastName) {
                    throw new Error('Please fill in all required fields');
                }

                // Validate password match
                if (this.formData.password !== this.formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Construct full URLs from handles
                const submitData = {
                    ...this.formData,
                    // Remove confirmPassword as it's not needed in the API
                    confirmPassword: undefined,
                    // Construct full URLs from handles
                    linkedinUrl: this.formData.linkedinHandle ? `https://linkedin.com/in/${this.formData.linkedinHandle}` : null,
                    twitterUrl: this.formData.twitterHandle ? `https://twitter.com/${this.formData.twitterHandle}` : null,
                    githubUrl: this.formData.githubHandle ? `https://github.com/${this.formData.githubHandle}` : null,
                    // Remove handle fields as they're not needed in the API
                    linkedinHandle: undefined,
                    twitterHandle: undefined,
                    githubHandle: undefined
                };

                await auth.signup(submitData);
                this.formSubmitted = true;
                this.currentStep = 4;
            } catch (error) {
                this.error = error.message;
                notifications.error(error.message);
            } finally {
                this.isLoading = false;
            }
        },

        nextStep() {
            if (this.currentStep < 4) {
                this.currentStep++;
            }
        },

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
            }
        },

        async fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
    }));

    // Add country select data
    Alpine.data('countrySelect', () => ({
        countries: [],
        isLoading: false,
        init() {
            // Get the country select element
            const countrySelect = document.getElementById('country-select');

            // Wait for the select to be initialized
            const checkSelect = setInterval(() => {
                const countrySelectInstance = window.HSSelect.getInstance(countrySelect);

                if (countrySelectInstance && countrySelectInstance.el) {
                    clearInterval(checkSelect);
                    // Fetch countries from countriesnow API
                    this.fetchCountries(countrySelectInstance);

                    // Listen for changes on the country select
                    countrySelect.addEventListener('change', (e) => {
                        countrySelectInstance.setValue(e.target.value);
                    });
                }
            }, 100);
        },
        fetchCountries(countrySelectInstance) {
            if (!countrySelectInstance || !countrySelectInstance.el) return;

            this.isLoading = true;

            // Clear existing countries first
            countrySelectInstance.setValue('');

            // Get all current options and remove them
            const currentOptions = Array.from(countrySelectInstance.el.querySelectorAll('option'))
                .filter(opt => opt.value !== '') // Keep the placeholder
                .map(opt => opt.value);

            if (currentOptions.length > 0) {
                countrySelectInstance.removeOption(currentOptions);
            }

            fetch('https://countriesnow.space/api/v0.1/countries', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        throw new Error(data.msg || 'Failed to fetch countries');
                    }

                    if (!data.data || !Array.isArray(data.data)) {
                        throw new Error('Invalid data format received from API');
                    }

                    // Process countries to remove duplicates and clean up formatting
                    const processedCountries = data.data
                        .map(country => country.country)
                        .filter((country, index, self) => self.indexOf(country) === index) // Remove duplicates
                        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

                    // Convert to the required format for addOptions
                    const countryOptions = processedCountries.map(country => ({
                        title: country,
                        val: country
                    }));

                    // Add the new countries
                    countrySelectInstance.addOption(countryOptions);

                    this.isLoading = false;
                })
                .catch(error => {
                    console.error('Error in fetchCountries:', error);
                    this.isLoading = false;
                });
        }
    }));

    // Add city select data
    Alpine.data('citySelect', () => ({
        cities: [],
        isLoading: false,
        hasCountryBeenSelected: false,
        init() {
            // Get the country select element
            const countrySelect = document.getElementById('country-select');

            // Listen for changes on the country select
            countrySelect.addEventListener('change', (e) => {
                const countryCode = e.target.value;
                if (countryCode) {
                    this.hasCountryBeenSelected = true;
                    this.fetchCities(countryCode);
                } else {
                    this.hasCountryBeenSelected = false;
                    // Clear cities using addOptions with empty array
                    const citySelect = document.getElementById('city-select');
                    const citySelectInstance = window.HSSelect.getInstance(citySelect);
                    citySelectInstance.addOption([]);
                }
            });
        },
        fetchCities(countryCode) {
            if (!countryCode) return;

            this.isLoading = true;

            // Get the city select element and its instance
            const citySelect = document.getElementById('city-select');
            const citySelectInstance = window.HSSelect.getInstance(citySelect);

            // Clear existing cities first
            citySelectInstance.setValue('');

            // Get all current options and remove them
            const currentOptions = Array.from(citySelectInstance.el.querySelectorAll('option'))
                .filter(opt => opt.value !== '') // Keep the placeholder
                .map(opt => opt.value);

            if (currentOptions.length > 0) {
                citySelectInstance.removeOption(currentOptions);
            }

            fetch(`https://countriesnow.space/api/v0.1/countries/cities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ country: countryCode })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        throw new Error(data.msg || 'Failed to fetch cities');
                    }

                    if (!data.data || !Array.isArray(data.data)) {
                        throw new Error('Invalid data format received from API');
                    }

                    // Process cities to remove duplicates and clean up formatting
                    const processedCities = data.data
                        .filter((city, index, self) => self.indexOf(city) === index) // Remove duplicates
                        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

                    // Convert to the required format for addOptions
                    const cityOptions = processedCities.map(city => ({
                        title: city,
                        val: city
                    }));

                    // Add the new cities
                    citySelectInstance.addOption(cityOptions);

                    this.isLoading = false;
                })
                .catch(error => {
                    console.error('Error fetching cities:', error);
                    this.isLoading = false;
                });
        }
    }));
});
