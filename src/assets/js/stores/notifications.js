// Create a store for notifications
export default {
    notyf: null,
    
    init() {
        // Initialize Notyf if not already initialized
        if (!this.notyf) {
            this.notyf = new Notyf({
                duration: 3000,
                position: { x: 'right', y: 'bottom' },
                types: [
                    {
                        type: 'success',
                        background: 'var(--color-primary)',
                        icon: {
                            className: 'icon-[tabler--circle-check]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'error',
                        background: 'var(--color-error)',
                        icon: {
                            className: 'icon-[tabler--circle-x]',
                            tagName: 'i'
                        }
                    }
                ]
            });
        }
    },

    success(message) {
        this.init();
        this.notyf.success(message);
    },

    error(message) {
        this.init();
        this.notyf.error(message);
    }
}; 