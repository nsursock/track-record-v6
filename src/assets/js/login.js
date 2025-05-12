import auth from './stores/auth.js';
import notifications from './stores/notifications.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('loginForm', () => ({
    formData: {
      email: '',
      password: '',
      rememberMe: false
    },
    isLoading: false,
    error: null,

    init() {
      // Initialize auth store
      auth.init();
    },

    async submitForm() {
      this.isLoading = true;
      this.error = null;

      try {
        await auth.login(
          this.formData.email,
          this.formData.password,
          this.formData.rememberMe
        );
        // No need to handle redirection here as it's handled in auth.login()
      } catch (error) {
        this.error = error.message;
        notifications.error(error.message);
      } finally {
        this.isLoading = false;
      }
    }
  }));
}); 