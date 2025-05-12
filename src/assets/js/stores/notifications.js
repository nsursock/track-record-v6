import { Notyf } from 'notyf';

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
                    },
                    {
                        type: 'info',
                        background: 'var(--color-info)',
                        icon: {
                            className: 'icon-[tabler--info-circle]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'warning',
                        background: 'var(--color-warning)',
                        icon: {
                            className: 'icon-[tabler--alert-triangle]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'primary',
                        background: 'var(--color-primary)',
                        icon: {
                            className: 'icon-[tabler--star]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'secondary',
                        background: 'var(--color-secondary)',
                        icon: {
                            className: 'icon-[tabler--star-half]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'accent',
                        background: 'var(--color-accent)',
                        icon: {
                            className: 'icon-[tabler--sparkles]',
                            tagName: 'i'
                        }
                    },
                    {
                        type: 'neutral',
                        background: 'var(--color-neutral)',
                        icon: {
                            className: 'icon-[tabler--circle]',
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
    },

    info(message) {
        this.init();
        this.notyf.open({
            type: 'info',
            message: message
        });
    },

    warning(message) {
        this.init();
        this.notyf.open({
            type: 'warning',
            message: message
        });
    },

    primary(message) {
        this.init();
        this.notyf.open({
            type: 'primary',
            message: message
        });
    },

    secondary(message) {
        this.init();
        this.notyf.open({
            type: 'secondary',
            message: message
        });
    },

    accent(message) {
        this.init();
        this.notyf.open({
            type: 'accent',
            message: message
        });
    },

    neutral(message) {
        this.init();
        this.notyf.open({
            type: 'neutral',
            message: message
        });
    }
}; 