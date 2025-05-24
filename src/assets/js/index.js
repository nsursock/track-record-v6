import '../css/index.css';

import Alpine from 'alpinejs'
import "./signup.js"
import "./login.js"
import notifications from "./stores/notifications.js"
import auth from "./stores/auth.js"

window.Alpine = Alpine
window.auth = auth  // Make auth store globally accessible
window.notifications = notifications  // Make notifications store globally accessible


// Add Alpine extensions here
Alpine.data('themes', () => ({
    selectedTheme: localStorage.getItem('theme') || 'light',
    themeGroups: [
        {
            name: 'Custom Themes',
            themes: [
                { value: 'cyberpunk', label: 'Cyberpunk', icon: 'icon-[tabler--robot]', description: 'Futuristic theme with neon accents\nand cyberpunk aesthetics' }
            ]
        },
        {
            name: 'FlyonUI Themes',
            themes: [
                { value: 'light', label: 'Light', icon: 'icon-[tabler--sun]', description: 'Clean and bright interface\nwith high contrast for optimal readability' },
                { value: 'dark', label: 'Dark', icon: 'icon-[tabler--moon]', description: 'Elegant dark mode that reduces\neye strain in low-light environments' },
                { value: 'black', label: 'Black', icon: 'icon-[tabler--moon-stars]', description: 'True black theme optimized\nfor OLED displays with maximum contrast' },
                { value: 'corporate', label: 'Corporate', icon: 'icon-[tabler--building]', description: 'Professional design with a focus\non clarity and business aesthetics' },
                { value: 'ghibli', label: 'Ghibli', icon: 'icon-[tabler--trees]', description: 'Whimsical and artistic theme\ninspired by Studio Ghibli\'s magical worlds' },
                { value: 'gourmet', label: 'Gourmet', icon: 'icon-[tabler--cookie]', description: 'Warm and inviting design\nwith rich, appetizing color palette' },
                { value: 'luxury', label: 'Luxury', icon: 'icon-[tabler--diamond]', description: 'Sophisticated theme with premium\naesthetics and elegant details' },
                { value: 'mintlify', label: 'Mintlify', icon: 'icon-[tabler--leaf]', description: 'Modern documentation theme\nwith clean typography and clear hierarchy' },
                { value: 'shadcn', label: 'Shadcn', icon: 'icon-[tabler--components]', description: 'Minimalist design system\nwith focus on accessibility and usability' },
                { value: 'slack', label: 'Slack', icon: 'icon-[tabler--brand-slack]', description: 'Familiar interface inspired\nby Slack\'s popular communication platform' },
                { value: 'soft', label: 'Soft', icon: 'icon-[tabler--cloud]', description: 'Gentle and calming design\nwith subtle colors and soft edges' },
                { value: 'valorant', label: 'Valorant', icon: 'icon-[tabler--sword]', description: 'Dynamic gaming-inspired theme\nwith bold accents and modern aesthetics' }
            ]
        },
        {
            name: 'DaisyUI Themes',
            themes: [
                { value: 'abyss', label: 'Abyss', icon: 'icon-[tabler--massage]', description: 'Deep and immersive dark theme\nwith a soothing atmosphere' },
                { value: 'acid', label: 'Acid', icon: 'icon-[tabler--pill]', description: 'Vibrant and energetic theme\nwith bold, eye-catching elements' },
                { value: 'aqua', label: 'Aqua', icon: 'icon-[tabler--droplet]', description: 'Refreshing blue-themed interface\nwith a calm, water-inspired palette' },
                { value: 'autumn', label: 'Autumn', icon: 'icon-[tabler--trees]', description: 'Warm and cozy theme\nwith rich fall colors and natural elements' },
                { value: 'bumblebee', label: 'Bumblebee', icon: 'icon-[tabler--wheel]', description: 'Cheerful yellow theme\nwith a playful and energetic vibe' },
                { value: 'business', label: 'Business', icon: 'icon-[tabler--building]', description: 'Professional theme designed\nfor corporate and business applications' },
                { value: 'caramellatte', label: 'Caramellatte', icon: 'icon-[tabler--coffee]', description: 'Warm and inviting theme\ninspired by your favorite coffee drink' }
            ]
        }
    ],
    init() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.selectedTheme);

        // Watch for theme changes
        this.$watch('selectedTheme', (value) => {
            document.documentElement.setAttribute('data-theme', value);
            localStorage.setItem('theme', value);
        });
    },
    setTheme(theme) {
        this.selectedTheme = theme;
    }
}))

// Scrollspy Component
document.addEventListener('alpine:init', () => {
  Alpine.data('scrollspy', () => ({
    activeSection: null,
    sections: [],
    links: [],
    init() {
      // Get all headings
      this.sections = Array.from(document.querySelectorAll('#scrollspy h2, #scrollspy h3'));
      
      // Get all scrollspy links
      this.links = Array.from(document.querySelectorAll('[data-scrollspy] a'));
      
      // Add click handlers for smooth scrolling
      this.links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // Initial update
      this.updateActiveSection();
      
      // Update on scroll with debounce
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.updateActiveSection();
        }, 100);
      }, { passive: true });
    },
    updateActiveSection() {
      const viewportHeight = window.innerHeight;
      const viewportMiddle = viewportHeight / 2;
      
      // Find the active heading
      let activeSection = null;
      let minDistance = Infinity;
      
      this.sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - viewportMiddle);
        
        if (distance < minDistance) {
          minDistance = distance;
          activeSection = section;
        }
      });
      
      this.activeSection = activeSection?.id || null;
    },
    isActive(href) {
      return this.activeSection === href.replace('#', '');
    }
  }));
});

// Header Component
document.addEventListener('alpine:init', () => {
  Alpine.data('header', () => ({
    user: null,
    isDropdownOpen: false,

    async init() {
      try {
        // Check if we have a session first
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session) {
          return;
        }

        // Check if token is expired
        const tokenExp = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        let accessToken = session.access_token;
        
        // If token is expired or will expire soon, try to refresh it
        if (!tokenExp || tokenExp < now + 300) { // 5 minute buffer
          console.log('Token expired or expiring soon, attempting refresh...');
          try {
            const refreshResponse = await fetch('/api/credentials?action=refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                refresh_token: session.refresh_token 
              })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.session) {
                localStorage.setItem('session', JSON.stringify(refreshData.session));
                accessToken = refreshData.session.access_token;
                console.log('Token refreshed successfully');
              }
            } else {
              console.error('Token refresh failed, clearing session');
              localStorage.removeItem('session');
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            localStorage.removeItem('session');
            return;
          }
        }

        // Now make the profile request with valid token
        const response = await fetch('/api/credentials?action=profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.user = data.user;
        } else if (response.status === 401 || response.status === 403) {
          console.log('Profile request failed with auth error, clearing session');
          localStorage.removeItem('session');
        }
      } catch (error) {
        console.error('Header init error:', error);
        localStorage.removeItem('session');
      }
    },

    // toggleDropdown() {
    //   this.isDropdownOpen = !this.isDropdownOpen;
    // },

    // closeDropdown() {
    //   this.isDropdownOpen = false;
    // },

    async logout() {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session) {
          await fetch('/api/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        }
        localStorage.removeItem('session');
        window.location.href = '/login/';
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }));
});

// Initialize theme switching
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Add click handlers for theme buttons
    document.querySelectorAll('[data-theme]').forEach(button => {
        button.addEventListener('click', (e) => {
            const theme = e.currentTarget.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    });
});

// Image Modal Component
document.addEventListener('alpine:init', () => {
  Alpine.data('imageModal', () => ({
    init() {
      // Add data-overlay attributes to all images in the content
      document.querySelectorAll('#scrollspy img, .relative.h-\\[400px\\] img').forEach(img => {
        img.setAttribute('data-overlay', '#imageModal');
        img.setAttribute('aria-haspopup', 'dialog');
        img.setAttribute('aria-expanded', 'false');
        img.setAttribute('aria-controls', 'imageModal');
        
        // Store original image URL
        let originalSrc;
        if (img.closest('.relative.h-\\[400px\\]')) {
          // For hero image, use the data-original-src attribute
          originalSrc = img.getAttribute('data-original-src');
        } else {
          // For content images, remove the transform parameters
          originalSrc = img.src.replace('/upload/w_320,h_240,c_fill,q_80,f_jpg/', '/upload/');
        }
        
        // Update modal image when clicked
        img.addEventListener('click', function() {
          const modalImage = document.querySelector('#modalImage');
          const modalImageUrl = document.querySelector('#modalImageUrl');
          modalImage.src = originalSrc;
          modalImage.alt = this.alt;
          modalImageUrl.textContent = originalSrc;
        });
      });
    }
  }));
});

// Hit Wizard Component
document.addEventListener('alpine:init', () => {
  Alpine.data('hitWizard', () => ({
    yeahs: 281,
    moddas: 58,
    horny: 34,
    subject: "Gangsta's",
    melody: "Queen",
    audience: "12 - 14 years old",
    backgroundLyrics: "Yeah Uh-huh",
    girls: 45,
    gold: 16,
    brothas: 22,
    car: "Mercedes",
    shakeAss: "Yes",
    outfits: "Gold",
    water: "Swimming pool",
    criminal: true,
    profit: 1600,
    videoUrl: '',
    showPrompt: false,
    videoPrompt: {
        scene: '',
        music: {
            melody: '',
            lyrics: '',
            background: ''
        },
        visuals: {
            cast: '',
            location: '',
            style: ''
        },
        audience: ''
    },

    init() {
        // Initialize FlyonUI components
        this.$nextTick(() => {
            // Initialize selects
            document
                .querySelectorAll('[data-select]')
                .forEach(select => {
                    if (select) {
                        try {
                            // Wait for the select to be initialized
                            const checkSelect = setInterval(() => {
                                const selectInstance = window
                                    .HSSelect
                                    .getInstance(select);

                                if (selectInstance && selectInstance.el) {
                                    clearInterval(checkSelect);

                                    // Listen for changes on the select
                                    select.addEventListener('change', (e) => {
                                        selectInstance.setValue(e.target.value);
                                    });
                                }
                            }, 100);
                        } catch (error) {
                            console.error('Error initializing select:', error);
                        }
                    }
                });
        });
    },

    generate() {
        this.generatePrompt();
        // Here you would typically call your video generation API
        this.videoUrl = 'https://example.com/video.mp4'; // Placeholder
    },

    generatePrompt() {
        // Scene description
        this.videoPrompt = {
            scene: `A high-energy R&B music video featuring ${this.brothas} stylish artists in ${this.outfits.toLowerCase()} outfits, surrounded by ${this.girls} dancers. The scene is set in a luxurious ${this.water.toLowerCase()} setting with a ${this.car} prominently displayed.`,
            music: {
                melody: `Melody inspired by ${this.melody}'s iconic sound, adapted for modern R&B.`,
                lyrics: `Lyrics focus on ${this.subject.toLowerCase()}, with ${this.yeahs} "Yeah Uh-huh" and ${this.moddas} "Moddafokka" per minute.`,
                background: `Background vocals consist of ${this.backgroundLyrics.toLowerCase()} throughout the track.`
            },
            visuals: {
                cast: `${this.brothas} main artists wearing ${this.gold}kg of gold jewelry, accompanied by ${this.girls} dancers${this.shakeAss === 'Yes' ? ' performing synchronized dance moves' : ''}.`,
                location: `Set in a luxurious ${this.water.toLowerCase()} with a ${this.car} as a centerpiece.`,
                style: `Artists dressed in ${this.outfits.toLowerCase()} outfits, with ${this.criminal ? 'a mysterious, edgy atmosphere' : 'a glamorous, high-end aesthetic'}.`
            },
            audience: `Targeted at ${this.audience}, with an expected profit of $${this.profit} million.`
        };
    },

    async copyPrompt() {
        // First ensure the prompt is generated
        this.generatePrompt();
        
        const promptText = `R&B Music Video Prompt

Scene Description:
${this.videoPrompt.scene}

Music Elements:
- ${this.videoPrompt.music.melody}
- ${this.videoPrompt.music.lyrics}
- ${this.videoPrompt.music.background}

Visual Elements:
- ${this.videoPrompt.visuals.cast}
- ${this.videoPrompt.visuals.location}
- ${this.videoPrompt.visuals.style}

Target Audience:
${this.videoPrompt.audience}`.trim();

        try {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = promptText;
            textarea.style.position = 'fixed';  // Prevent scrolling to bottom
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            
            // Select and copy the text
            textarea.select();
            document.execCommand('copy');
            
            // Clean up
            document.body.removeChild(textarea);
            
            // Show success message using notifications store
            notifications.success('Prompt copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy prompt:', err);
            notifications.error('Failed to copy prompt. Please try again.');
        }
    }
  }));
});

// Profile Page Component
document.addEventListener('alpine:init', () => {
  Alpine.data('profilePage', () => ({
    user: null,
    isLoading: true,

    async init() {
      try {
        // Initialize auth store
        await auth.init();

        // Check if user is authenticated
        if (!auth.isAuthenticated()) {
          window.location.href = '/login/';
          return;
        }

        // Fetch profile data
        const response = await fetch('/api/credentials?action=profile', {
          headers: auth.getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired or invalid
            await auth.logout();
            window.location.href = '/login/';
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        this.user = data.user;
      } catch (error) {
        console.error('Error:', error);
        notifications.error(error.message || 'Failed to load profile');
        window.location.href = '/login/';
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await auth.logout();
      } catch (error) {
        console.error('Logout error:', error);
        notifications.error('Failed to logout. Please try again.');
      }
    },

    editProfile() {
      // TODO: Implement edit profile functionality
      alert('Edit profile functionality coming soon!');
    },

    deleteAccount() {
      const modal = new HSOverlay(document.querySelector('#delete-account-modal'));
      modal.open();
    },

    async confirmDeleteAccount() {
      try {
        const response = await fetch('/api/credentials?action=profile', {
          method: 'DELETE',
          headers: auth.getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete account');
        }

        await auth.logout();
      } catch (error) {
        console.error('Delete account error:', error);
        notifications.error(error.message || 'Failed to delete account. Please try again.');
      }
    }
  }));
});

// Text-to-Speech Component
document.addEventListener('alpine:init', () => {
  Alpine.store('tts', {
    // State
    isPlayerVisible: false,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentSegmentIndex: 0,
    progress: 0,
    currentTime: '0:00',
    totalTime: '0:00',
    isInitialized: false,
    isFallbackMode: false, // Track if we're using fallback voice
    
    // Timer-related properties
    timerInterval: null,
    segmentStartTime: null,
    totalElapsedTime: 0,
    estimatedSegmentDurations: [], // Store estimated duration for each segment
    
    // Settings
    playbackRate: 1.0,
    pitch: 1.0,
    selectedVoiceIndex: 0,
    highlightText: true,
    autoScroll: true,
    
    // Internal
    textSegments: [],
    utterances: [],
    voices: [],
    currentHighlight: null,
    contentSelector: '#scrollspy',

    async init() {
      // Prevent double initialization
      if (this.isInitialized) {
        console.log('TTS: Already initialized, skipping');
        return;
      }

      // Only initialize on pages with article content
      if (!document.querySelector(this.contentSelector)) {
        console.log('TTS: Not on a blog post page, skipping initialization');
        return;
      }

      // Check if browser supports speech synthesis
      if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        notifications.error('Text-to-speech is not supported in your browser');
        return;
      }

      console.log('TTS: Initializing on blog post page');
      this.isInitialized = true;

      // Load voices
      await this.loadVoices();
      
      // Load saved settings
      this.loadSettings();
      
      // Extract content
      this.extractContent();
      
      // Check for auto-start (but don't auto-play due to browser restrictions)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('listen') === 'true') {
        console.log('TTS: Auto-showing player due to ?listen=true');
        this.show();
        // Give Alpine a moment to update the DOM
        setTimeout(() => {
          notifications.info('Click the play button in the audio player to start listening');
        }, 300);
      }
      
      // Initialize FlyonUI components after Alpine is ready
      const self = this;
      Alpine.nextTick(() => {
        setTimeout(() => {
          self.initializeFlyonUIComponents();
        }, 500); // Small delay to ensure DOM is fully ready
      });
    },

    async loadVoices() {
      return new Promise((resolve) => {
        const loadVoicesInternal = () => {
          this.voices = speechSynthesis.getVoices();
          console.log('TTS: Raw voices loaded:', this.voices.length);
          console.log('TTS: First few voices:', this.voices.slice(0, 5).map(v => ({ name: v.name, lang: v.lang, localService: v.localService })));
          
          if (this.voices.length > 0) {
            // Simplified voice selection - prefer English voices but don't exclude specific ones
            const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en-'));
            console.log('TTS: English voices found:', englishVoices.length);
            console.log('TTS: English voices:', englishVoices.slice(0, 3).map(v => ({ name: v.name, lang: v.lang })));
            
            // Simple selection: prefer enhanced/premium voices, but allow any English voice
            const preferredVoice = englishVoices.find(voice => 
              voice.name.includes('Enhanced') || 
              voice.name.includes('Premium') ||
              voice.name.includes('Natural')
            ) || englishVoices[0] || this.voices[0];
            
            console.log('TTS: Preferred voice selected:', { 
              name: preferredVoice.name, 
              lang: preferredVoice.lang, 
              localService: preferredVoice.localService,
              default: preferredVoice.default
            });
            
            this.selectedVoiceIndex = this.voices.indexOf(preferredVoice);
            console.log('TTS: Selected voice index:', this.selectedVoiceIndex);
            resolve();
          }
        };

        loadVoicesInternal();
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = loadVoicesInternal;
        }
      });
    },

    extractContent() {
      const contentElement = document.querySelector(this.contentSelector);
      if (!contentElement) {
        console.warn('Content element not found:', this.contentSelector);
        notifications.error('Could not find article content to read');
        return;
      }

      // Extract text segments
      this.textSegments = [];
      
      // First, add the title and meta description
      const titleElement = document.querySelector('h1');
      
      console.log('TTS: Title element found:', titleElement);
      
      if (titleElement && titleElement.textContent.trim()) {
        const titleText = `Article title: ${titleElement.textContent.trim()}`;
        console.log('TTS: Adding title segment:', titleText);
        this.textSegments.push({
          text: titleText,
          element: titleElement,
          node: titleElement.firstChild || titleElement,
          isIntro: true
        });
      }
      
      // Try to get meta description from different sources
      let metaDescription = '';
      let descriptionElement = null;
      
      // First try: article-specific description in hero section (most accurate)
      const heroDescElement = document.querySelector('.space-y-6 .space-y-4 p.text-base, .space-y-6 .space-y-4 p.text-lg, .space-y-6 .space-y-4 p.text-xl');
      if (heroDescElement && heroDescElement.textContent.trim()) {
        metaDescription = heroDescElement.textContent.trim();
        descriptionElement = heroDescElement;
        console.log('TTS: Using hero section description:', metaDescription);
      }
      
      // Second try: OpenGraph description (more likely to be article-specific)
      if (!metaDescription) {
        const ogDescElement = document.querySelector('meta[property="og:description"]');
        if (ogDescElement && ogDescElement.content) {
          metaDescription = ogDescElement.content;
          descriptionElement = ogDescElement;
          console.log('TTS: Using OpenGraph description:', metaDescription);
        }
      }
      
      // Third try: find article excerpt or summary in the content
      if (!metaDescription) {
        const excerptElement = document.querySelector('.excerpt, .summary, .lead');
        if (excerptElement && excerptElement.textContent.trim()) {
          metaDescription = excerptElement.textContent.trim();
          descriptionElement = excerptElement;
          console.log('TTS: Using content excerpt:', metaDescription);
        }
      }
      
      // Last resort: use the main meta description (but this is likely generic)
      if (!metaDescription) {
        const mainMetaDesc = document.querySelector('meta[name="description"]');
        if (mainMetaDesc && mainMetaDesc.content) {
          metaDescription = mainMetaDesc.content;
          descriptionElement = mainMetaDesc;
          console.log('TTS: Using main meta description (generic):', metaDescription);
        }
      }
      
      console.log('TTS: Final meta description found:', metaDescription);
      
      if (metaDescription) {
        const descText = `Article description: ${metaDescription}`;
        console.log('TTS: Adding description segment:', descText);
        this.textSegments.push({
          text: descText,
          element: descriptionElement || titleElement || document.body,
          node: (descriptionElement || titleElement || document.body).firstChild || document.body.firstChild,
          isIntro: true
        });
      }
      
      // Add a pause before main content
      this.textSegments.push({
        text: 'Now beginning the article content.',
        element: titleElement || document.body,
        node: titleElement?.firstChild || document.body.firstChild,
        isIntro: true
      });

      // Extract content using semantic chunks instead of individual text nodes
      const semanticElements = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption');
      
      semanticElements.forEach((element, index) => {
        const text = element.textContent.trim();
        
        // Skip empty elements or very short text
        if (!text || text.length < 10) return;
        
        // Skip elements that are inside code blocks or other excluded areas
        if (element.closest('code, pre, script, style, .toc, .table-of-contents, nav, .breadcrumbs')) {
          return;
        }
        
        console.log(`TTS: Found semantic element ${index}:`, element.tagName, text.substring(0, 50) + '...');
        
        this.textSegments.push({
          text,
          element,
          node: element,
          isHeading: /^h[1-6]$/i.test(element.tagName),
          isParagraph: element.tagName.toLowerCase() === 'p',
          isListItem: element.tagName.toLowerCase() === 'li',
          isBlockquote: element.tagName.toLowerCase() === 'blockquote'
        });
      });

      console.log('TTS: All text segments:', this.textSegments.map((s, i) => `${i}: ${s.text.substring(0, 50)}...`));
      
      this.createUtterances();
      this.updateTotalTime();
      console.log(`TTS: Extracted ${this.textSegments.length} text segments (including title and description)`);
    },

    createUtterances() {
      console.log('TTS: Creating utterances from', this.textSegments.length, 'segments');
      
      // Calculate segment durations for better time estimation
      this.calculateSegmentDurations();
      
      this.utterances = this.textSegments.map((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Keep it simple - only set essential properties
        utterance.voice = this.voices[this.selectedVoiceIndex];
        utterance.rate = this.playbackRate;
        utterance.pitch = this.pitch;
        utterance.volume = 1.0;
        // Don't explicitly set lang - let the voice handle it
        
        console.log(`TTS: Created utterance ${index}:`, segment.text.substring(0, 50) + '...');
        console.log(`TTS: Utterance ${index} voice:`, utterance.voice ? utterance.voice.name : 'null');
        
        // Debug: Check if voice is still valid
        if (utterance.voice && !speechSynthesis.getVoices().includes(utterance.voice)) {
          console.warn(`TTS: Voice for utterance ${index} is no longer available`);
        }
        
        utterance.onstart = () => {
          console.log(`🎤 TTS: Started speaking segment ${index}:`, segment.text.substring(0, 30) + '...');
          console.log(`🔍 TTS: Segment structure:`, {
            text: segment.text.substring(0, 50) + '...',
            element: segment.element,
            elementTagName: segment.element?.tagName,
            elementClassName: segment.element?.className,
            isIntro: segment.isIntro,
            isHeading: segment.isHeading,
            isParagraph: segment.isParagraph
          });
          
          this.currentSegmentIndex = index;
          
          // Update timer for new segment
          if (index > 0) {
            // Add previous segment duration to total elapsed time
            this.totalElapsedTime += this.estimatedSegmentDurations[index - 1] || 0;
          }
          this.segmentStartTime = Date.now();
          
          console.log(`🎯 TTS: About to call highlightSegment for segment ${index}`);
          this.highlightSegment(segment);
          console.log(`✅ TTS: highlightSegment call completed for segment ${index}`);
          
          this.updateProgress();
        };
        
        utterance.onend = () => {
          console.log(`TTS: Finished speaking segment ${index}`);
          this.removeHighlight();
          // Automatically continue to next segment if playing
          if (this.isPlaying && index < this.textSegments.length - 1) {
            this.currentSegmentIndex++;
            console.log(`TTS: Auto-continuing to segment ${this.currentSegmentIndex}`);
            // Play next utterance
            if (this.currentSegmentIndex < this.utterances.length) {
              speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
            }
          } else if (index === this.textSegments.length - 1) {
            // Reached the end
            console.log('TTS: Reached end of article');
            this.stop();
            notifications.success('Finished reading the article');
          }
        };
        
        utterance.onboundary = (event) => {
          console.log(`TTS: Boundary event for segment ${index}:`, event.name, 'at char', event.charIndex);
        };
        
        utterance.onpause = () => {
          console.log(`TTS: Paused segment ${index}`);
        };
        
        utterance.onresume = () => {
          console.log(`TTS: Resumed segment ${index}`);
        };
        
        utterance.onerror = (event) => {
          console.error(`TTS: Error for segment ${index}:`, event.error, event);
          
          // Handle specific error types
          switch(event.error) {
            case 'canceled':
              // Don't show error if this is part of the intentional fallback mechanism
              if (this.isFallbackMode && index === 0) {
                console.log('TTS: Canceled as part of fallback mechanism - this is expected');
                return; // Don't show error notification
              }
              notifications.error('Speech synthesis was canceled');
              break;
            case 'not-allowed':
              notifications.error('Speech synthesis not allowed. Please click the play button to start.');
              this.stop();
              break;
            case 'network':
              notifications.error('Network error during speech synthesis. Please try again.');
              break;
            case 'synthesis-failed':
              notifications.error('Speech synthesis failed. Please try a different voice.');
              break;
            case 'audio-busy':
              notifications.error('Audio is busy. Please try again in a moment.');
              break;
            case 'audio-hardware':
              notifications.error('Audio hardware error. Please check your speakers/headphones.');
              break;
            default:
              notifications.error(`Speech synthesis error: ${event.error}`);
          }
        };
        
        return utterance;
      });
      
      console.log('TTS: Created', this.utterances.length, 'utterances');
      console.log('TTS: Selected voice:', this.voices[this.selectedVoiceIndex]);
      console.log('TTS: Speech synthesis supported:', 'speechSynthesis' in window);
      console.log('TTS: Available voices:', this.voices.length);
    },

    show() {
      if (!this.isInitialized) {
        notifications.error('Text-to-speech is not available on this page');
        return;
      }
      
      console.log('TTS: Showing player, isPlayerVisible will be set to true');
      this.isPlayerVisible = true;
      
      // Initialize FlyonUI components after Alpine is ready
      const self = this;
      Alpine.nextTick(() => {
        setTimeout(() => {
          self.initializeFlyonUIComponents();
        }, 500); // Small delay to ensure DOM is fully ready
      });
      
      notifications.success('Audio player ready');
    },
    
    initializeFlyonUIComponents() {
      console.log('TTS: Initializing FlyonUI components');
      
      // Initialize modal if not already initialized
      const modal = document.querySelector('#tts-settings-modal');
      if (modal && window.HSOverlay) {
        try {
          const existingModal = window.HSOverlay.getInstance(modal);
          if (!existingModal) {
            new window.HSOverlay(modal);
            console.log('TTS: Initialized settings modal');
          }
        } catch (error) {
          console.error('TTS: Error initializing modal:', error);
        }
      }
      
      // Initialize advanced selects with a small delay
      setTimeout(() => {
        this.initializeAdvancedSelects();
      }, 200);
    },

    initializeAdvancedSelects() {
      // Initialize FlyonUI advanced select components in the settings modal
      document.querySelectorAll('#tts-settings-modal [data-select]').forEach(select => {
        if (select && window.HSSelect) {
          try {
            // Check if already initialized
            const existingInstance = window.HSSelect.getInstance(select);
            if (!existingInstance) {
              const selectInstance = new window.HSSelect(select);
              console.log('TTS: Initialized advanced select:', select);
              
              // Listen for changes
              select.addEventListener('change', (e) => {
                console.log('TTS: Advanced select changed:', e.target.value);
                this.updateSettings();
              });
            }
          } catch (error) {
            console.error('TTS: Error initializing advanced select:', error);
            // Fallback to regular select if advanced select fails
            select.classList.remove('hidden');
            select.removeAttribute('data-select');
          }
        }
      });
    },

    hide() {
      this.isPlayerVisible = false;
      this.stop();
    },

    togglePlayPause() {
      if (!this.isInitialized) return;
      
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    play() {
      if (!this.isInitialized) return;
      
      console.log('TTS: Play method called');
      
      // Stop and reset any existing speech
      speechSynthesis.cancel();
      
      // Reset state
      this.isPlaying = true;
      this.isPaused = false;
      this.currentSegmentIndex = 0;
      
      // Reset timer state
      this.totalElapsedTime = 0;
      this.segmentStartTime = null;
      
      // Start the timer
      this.startTimer();
      
      // Give browser a moment to process the cancel
      setTimeout(() => {
        this.playAfterReset();
      }, 50);
    },
    
    playAfterReset() {
      console.log('TTS: Play method called');
      console.log('TTS: Current segment index:', this.currentSegmentIndex);
      console.log('TTS: Total utterances:', this.utterances.length);
      console.log('TTS: isPaused:', this.isPaused);
      console.log('TTS: speechSynthesis.speaking:', speechSynthesis.speaking);
      console.log('TTS: speechSynthesis.pending:', speechSynthesis.pending);
      console.log('TTS: speechSynthesis.paused:', speechSynthesis.paused);
      
      try {
        if (this.isPaused) {
          console.log('TTS: Resuming speech synthesis');
          speechSynthesis.resume();
          this.isPaused = false;
          this.isPlaying = true;
          
          // Restart timer from current position
          this.segmentStartTime = Date.now();
          this.startTimer();
        } else {
          console.log(`TTS: Starting speech synthesis at segment ${this.currentSegmentIndex}`);
          this.isPlaying = true;
          if (this.currentSegmentIndex < this.utterances.length) {
            speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
          }
        }
      } catch (error) {
        console.error('TTS: Error in playAfterReset:', error);
        notifications.error('Failed to start speech synthesis');
      }
    },
    
    pause() {
      speechSynthesis.pause();
      this.isPaused = true;
      this.isPlaying = false;
      
      // Update elapsed time before pausing timer
      if (this.segmentStartTime) {
        const segmentElapsed = (Date.now() - this.segmentStartTime) / 1000;
        this.totalElapsedTime += segmentElapsed;
        this.segmentStartTime = null;
      }
      
      this.stopTimer();
    },

    stop() {
      speechSynthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentSegmentIndex = 0;
      this.removeHighlight();
      
      // Reset timer state
      this.stopTimer();
      this.totalElapsedTime = 0;
      this.segmentStartTime = null;
      this.currentTime = '0:00';
      this.progress = 0;
    },

    previous() {
      if (!this.isInitialized) return;
      
      if (this.currentSegmentIndex > 0) {
        console.log(`TTS: Going to previous segment ${this.currentSegmentIndex - 1}`);
        speechSynthesis.cancel();
        
        // Update timer for segment change
        this.currentSegmentIndex--;
        this.totalElapsedTime = this.estimatedSegmentDurations
          .slice(0, this.currentSegmentIndex)
          .reduce((total, duration) => total + duration, 0);
        this.segmentStartTime = Date.now();
        
        this.updateProgress();
        if (this.isPlaying) {
          // Start playing the previous segment
          speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
        }
      }
    },

    next() {
      if (!this.isInitialized) return;
      
      if (this.currentSegmentIndex < this.utterances.length - 1) {
        console.log(`TTS: Going to next segment ${this.currentSegmentIndex + 1}`);
        speechSynthesis.cancel();
        
        // Update timer for segment change
        this.currentSegmentIndex++;
        this.totalElapsedTime = this.estimatedSegmentDurations
          .slice(0, this.currentSegmentIndex)
          .reduce((total, duration) => total + duration, 0);
        this.segmentStartTime = Date.now();
        
        this.updateProgress();
        if (this.isPlaying) {
          // Start playing the next segment
          speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
        }
      }
    },

    updateProgress() {
      // Legacy method - now we use real-time updates via startTimer()
      // Just ensure the display is updated immediately for segment changes
      this.updateCurrentTime();
      this.updateProgressBar();
    },

    updateTotalTime() {
      // Legacy method - total time is now calculated in calculateSegmentDurations()
      // This is kept for backward compatibility
      if (this.estimatedSegmentDurations.length === 0 && this.utterances.length > 0) {
        // Fallback to old estimation if new system hasn't run yet
        const estimatedMinutes = Math.floor(this.utterances.length * 0.5);
        const estimatedSeconds = Math.floor((this.utterances.length * 0.5 % 1) * 60);
        this.totalTime = `${estimatedMinutes}:${estimatedSeconds.toString().padStart(2, '0')}`;
      }
    },

    // Calculate estimated duration for each segment based on text length and speaking rate
    calculateSegmentDurations() {
      this.estimatedSegmentDurations = this.textSegments.map(segment => {
        // Estimate words per minute based on playback rate
        const baseWPM = 200; // Average speaking speed
        const adjustedWPM = baseWPM * this.playbackRate;
        
        // Count words in segment
        const wordCount = segment.text.trim().split(/\s+/).length;
        
        // Calculate duration in seconds
        const durationSeconds = (wordCount / adjustedWPM) * 60;
        
        return Math.max(durationSeconds, 1); // Minimum 1 second per segment
      });
      
      // Recalculate total time based on segment durations
      const totalSeconds = this.estimatedSegmentDurations.reduce((total, duration) => total + duration, 0);
      this.totalTime = this.formatTime(totalSeconds);
    },

    // Start real-time timer updates
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      this.segmentStartTime = Date.now();
      
      this.timerInterval = setInterval(() => {
        if (this.isPlaying && !this.isPaused) {
          this.updateCurrentTime();
          this.updateProgressBar();
        }
      }, 100); // Update every 100ms for smooth progress
    },

    // Stop timer
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    // Update current time display
    updateCurrentTime() {
      if (this.segmentStartTime) {
        const segmentElapsed = (Date.now() - this.segmentStartTime) / 1000;
        const currentTime = this.totalElapsedTime + segmentElapsed;
        this.currentTime = this.formatTime(currentTime);
      }
    },

    // Update progress bar
    updateProgressBar() {
      if (this.estimatedSegmentDurations.length > 0) {
        const totalDuration = this.estimatedSegmentDurations.reduce((total, duration) => total + duration, 0);
        const segmentElapsed = this.segmentStartTime ? (Date.now() - this.segmentStartTime) / 1000 : 0;
        const currentTime = this.totalElapsedTime + segmentElapsed;
        
        this.progress = Math.min(Math.round((currentTime / totalDuration) * 100), 100);
      }
    },

    // Helper function to format time as MM:SS
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    highlightSegment(segment) {
      console.log('🔍 TTS: highlightSegment called with:', {
        highlightText: this.highlightText,
        isIntro: segment.isIntro,
        element: segment.element,
        elementTagName: segment.element?.tagName,
        elementText: segment.element?.textContent?.substring(0, 50) + '...'
      });
      
      if (!this.highlightText) {
        console.log('❌ TTS: Highlighting disabled in settings');
        return;
      }
      
      this.removeHighlight();
      
      // Don't highlight intro segments (title, description, etc.)
      if (segment.isIntro) {
        console.log('❌ TTS: Skipping intro segment');
        return;
      }
      
      const element = segment.element;
      
      if (!element) {
        console.error('❌ TTS: No element found for segment');
        return;
      }
      
      console.log('✅ TTS: Adding highlight to element:', element);
      
      // Apply very obvious inline styles with !important to override theme CSS
      // Simple yellow highlighting for all themes
      element.style.setProperty('background-color', 'rgba(255, 255, 0, 0.6)', 'important'); // yellow background
      element.style.setProperty('border', '5px solid #ca8a04', 'important'); // darker yellow border
      element.style.setProperty('box-shadow', '0 0 30px #ca8a04, 0 0 0 3px rgba(202, 138, 4, 0.3)', 'important');
      
      // Apply common styling properties
      element.style.setProperty('border-radius', '10px', 'important');
      element.style.setProperty('transform', 'scale(1.05) translateX(8px)', 'important');
      element.style.setProperty('transition', 'all 0.3s ease', 'important');
      element.style.setProperty('position', 'relative', 'important');
      element.style.setProperty('z-index', '10', 'important');
      element.style.setProperty('padding', element.tagName.toLowerCase() === 'p' ? '20px' : '16px', 'important');
      
      // Black text for readability on yellow background
      element.style.setProperty('color', '#000000', 'important');
      
      this.currentHighlight = element;
      
      // Verify highlighting is visible
      const finalStyles = window.getComputedStyle(element);
      console.log('🔍 TTS: Final background color:', finalStyles.backgroundColor);
      console.log('🔍 TTS: Final border:', finalStyles.border);
      console.log('🔍 TTS: Final transform:', finalStyles.transform);
      
      // Auto-scroll to current element if enabled
      if (this.autoScroll) {
        console.log('📜 TTS: Auto-scrolling to element');
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
      
      console.log('✅ TTS: Successfully highlighted element:', element.tagName, element.textContent.substring(0, 30) + '...');
    },

    removeHighlight() {
      console.log('🧹 TTS: removeHighlight called, currentHighlight:', this.currentHighlight);
      
      if (this.currentHighlight) {
        console.log('🧹 TTS: Removing highlight from:', this.currentHighlight.tagName);
        console.log('🔍 TTS: Element classes before removal:', this.currentHighlight.className);
        
        // Remove the highlight class
        this.currentHighlight.classList.remove('tts-highlight');
        
        // Clear all inline styles we applied with !important
        this.currentHighlight.style.removeProperty('background-color');
        this.currentHighlight.style.removeProperty('border');
        this.currentHighlight.style.removeProperty('border-radius');
        this.currentHighlight.style.removeProperty('box-shadow');
        this.currentHighlight.style.removeProperty('transform');
        this.currentHighlight.style.removeProperty('transition');
        this.currentHighlight.style.removeProperty('padding');
        this.currentHighlight.style.removeProperty('position');
        this.currentHighlight.style.removeProperty('z-index');
        this.currentHighlight.style.removeProperty('color');
        
        // Restore original styles if they were stored
        if (this.currentHighlight.dataset.originalStyles) {
          try {
            const originalStyles = JSON.parse(this.currentHighlight.dataset.originalStyles);
            this.currentHighlight.style.backgroundColor = originalStyles.backgroundColor;
            this.currentHighlight.style.border = originalStyles.border;
            this.currentHighlight.style.borderRadius = originalStyles.borderRadius;
            this.currentHighlight.style.boxShadow = originalStyles.boxShadow;
            this.currentHighlight.style.transform = originalStyles.transform;
            this.currentHighlight.style.transition = originalStyles.transition;
            this.currentHighlight.style.padding = originalStyles.padding;
            this.currentHighlight.style.position = originalStyles.position;
            this.currentHighlight.style.zIndex = originalStyles.zIndex;
            
            // Clean up stored data
            delete this.currentHighlight.dataset.originalStyles;
            console.log('✅ TTS: Original styles restored');
          } catch (error) {
            console.warn('TTS: Error restoring original styles:', error);
          }
        }
        
        console.log('🔍 TTS: Element classes after removal:', this.currentHighlight.className);
        
        this.currentHighlight = null;
        console.log('✅ TTS: Highlight removed successfully');
      } else {
        console.log('ℹ️ TTS: No current highlight to remove');
      }
    },

    updateSettings() {
      if (!this.isInitialized) return;
      
      console.log('TTS: Updating settings - rate:', this.playbackRate, 'pitch:', this.pitch, 'voice:', this.selectedVoiceIndex);
      console.log('TTS: Highlight text:', this.highlightText, 'Auto scroll:', this.autoScroll);
      
      const wasPlaying = this.isPlaying;
      const currentIndex = this.currentSegmentIndex;
      
      // Stop current playback
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.stopTimer();
      }
      
      // Recreate utterances with new settings
      this.createUtterances();
      
      // If we were playing, resume from where we left off
      if (wasPlaying) {
        this.currentSegmentIndex = currentIndex;
        // Recalculate elapsed time based on new durations
        this.totalElapsedTime = this.estimatedSegmentDurations
          .slice(0, this.currentSegmentIndex)
          .reduce((total, duration) => total + duration, 0);
        
        setTimeout(() => {
          this.play();
        }, 200);
      }
      
      // Save settings to localStorage for persistence
      try {
        localStorage.setItem('tts-settings', JSON.stringify({
          playbackRate: this.playbackRate,
          pitch: this.pitch,
          selectedVoiceIndex: this.selectedVoiceIndex,
          highlightText: this.highlightText,
          autoScroll: this.autoScroll
        }));
      } catch (e) {
        console.warn('TTS: Could not save settings to localStorage:', e);
      }
    },

    // Load settings from localStorage
    loadSettings() {
      try {
        const saved = localStorage.getItem('tts-settings');
        if (saved) {
          const settings = JSON.parse(saved);
          this.playbackRate = settings.playbackRate || 1.0;
          this.pitch = settings.pitch || 1.0;
          this.highlightText = settings.highlightText !== undefined ? settings.highlightText : true;
          this.autoScroll = settings.autoScroll !== undefined ? settings.autoScroll : true;
          
          // Only restore voice index if it's valid
          if (settings.selectedVoiceIndex >= 0 && settings.selectedVoiceIndex < this.voices.length) {
            this.selectedVoiceIndex = settings.selectedVoiceIndex;
          }
          
          console.log('TTS: Loaded settings from localStorage:', settings);
        }
      } catch (e) {
        console.warn('TTS: Could not load settings from localStorage:', e);
      }
    },

    // Test method to check individual voices
    testVoice(voiceIndex) {
      if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
        const voice = this.voices[voiceIndex];
        const testUtterance = new SpeechSynthesisUtterance('The quick brown fox jumps over the lazy dog. This voice sounds clear and natural.');
        testUtterance.voice = voice;
        testUtterance.rate = this.playbackRate;
        testUtterance.pitch = this.pitch;
        testUtterance.volume = 1.0;
        
        // Add a timeout to detect if the voice doesn't work
        let hasStarted = false;
        const timeoutId = setTimeout(() => {
          if (!hasStarted) {
            console.log(`❌ Voice ${voice.name} failed to start within 2 seconds`);
            notifications.error(`Voice "${voice.name}" is not working. Try selecting a different voice.`);
            speechSynthesis.cancel();
          }
        }, 2000);
        
        testUtterance.onstart = () => {
          hasStarted = true;
          clearTimeout(timeoutId);
          console.log(`✅ Voice ${voice.name} is working`);
          notifications.success(`Voice "${voice.name}" is working properly!`);
        };
        
        testUtterance.onerror = (event) => {
          clearTimeout(timeoutId);
          console.log(`❌ Voice ${voice.name} failed:`, event.error);
          notifications.error(`Voice "${voice.name}" failed: ${event.error}. Try selecting a different voice.`);
        };
        
        // Cancel any ongoing speech before testing
        speechSynthesis.cancel();
        setTimeout(() => {
          speechSynthesis.speak(testUtterance);
        }, 100);
      } else {
        notifications.error('Please select a voice to test.');
      }
    },

    // Test method to check highlighting functionality
    testHighlighting() {
      console.log('🧪 TTS: Testing highlighting functionality');
      
      // Check if CSS is loaded
      const testElement = document.createElement('div');
      testElement.classList.add('tts-highlight');
      document.body.appendChild(testElement);
      
      const computedStyles = window.getComputedStyle(testElement);
      console.log('🎨 TTS: CSS test - background color:', computedStyles.backgroundColor);
      console.log('🎨 TTS: CSS test - border:', computedStyles.border);
      console.log('🎨 TTS: CSS test - transform:', computedStyles.transform);
      
      const cssWorking = computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                        computedStyles.backgroundColor !== 'transparent';
      console.log('🎨 TTS: CSS highlighting working:', cssWorking);
      
      document.body.removeChild(testElement);
      
      // Test highlighting on the first paragraph
      const firstParagraph = document.querySelector('#scrollspy p');
      if (firstParagraph) {
        console.log('🧪 TTS: Testing highlight on first paragraph:', firstParagraph.textContent.substring(0, 50) + '...');
        
        // Simulate a segment
        const testSegment = {
          text: firstParagraph.textContent,
          element: firstParagraph,
          isIntro: false
        };
        
        this.highlightSegment(testSegment);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          this.removeHighlight();
          console.log('🧪 TTS: Test highlighting completed');
        }, 3000);
        
        notifications.info('Testing highlighting for 3 seconds...');
      } else {
        console.error('❌ TTS: No paragraphs found for testing');
        notifications.error('No content found to test highlighting');
      }
    },

    // Force highlight using inline styles for debugging
    forceHighlight() {
      console.log('💪 TTS: Force highlighting first paragraph with inline styles');
      
      const firstParagraph = document.querySelector('#scrollspy p');
      if (firstParagraph) {
        // Apply very obvious highlighting
        firstParagraph.style.backgroundColor = 'rgba(255, 0, 255, 0.6)';
        firstParagraph.style.border = '5px solid #ff00ff';
        firstParagraph.style.borderRadius = '10px';
        firstParagraph.style.boxShadow = '0 0 30px #ff00ff';
        firstParagraph.style.transform = 'scale(1.05)';
        firstParagraph.style.transition = 'all 0.3s ease';
        firstParagraph.style.padding = '20px';
        firstParagraph.style.position = 'relative';
        firstParagraph.style.zIndex = '100';
        
        notifications.success('Force highlighting applied! Should be very visible now.');
        
        // Remove after 5 seconds
        setTimeout(() => {
          firstParagraph.style.backgroundColor = '';
          firstParagraph.style.border = '';
          firstParagraph.style.borderRadius = '';
          firstParagraph.style.boxShadow = '';
          firstParagraph.style.transform = '';
          firstParagraph.style.padding = '';
          firstParagraph.style.position = '';
          firstParagraph.style.zIndex = '';
          console.log('💪 TTS: Force highlight removed');
        }, 5000);
      } else {
        notifications.error('No paragraph found to highlight');
      }
    },

    // Debug function to inspect extracted segments
    debugSegments() {
      console.log('🔍 TTS: Debugging extracted segments');
      console.log('📊 TTS: Total segments:', this.textSegments.length);
      
      this.textSegments.forEach((segment, index) => {
        console.log(`📝 Segment ${index}:`, {
          text: segment.text.substring(0, 100) + (segment.text.length > 100 ? '...' : ''),
          element: segment.element,
          elementExists: !!segment.element,
          elementTagName: segment.element?.tagName,
          elementInDOM: segment.element ? document.contains(segment.element) : false,
          isIntro: segment.isIntro,
          isHeading: segment.isHeading,
          isParagraph: segment.isParagraph,
          isListItem: segment.isListItem,
          isBlockquote: segment.isBlockquote
        });
      });
      
      // Also check how many non-intro segments we have
      const nonIntroSegments = this.textSegments.filter(s => !s.isIntro);
      console.log('📊 TTS: Non-intro segments (should be highlighted):', nonIntroSegments.length);
      
      if (nonIntroSegments.length > 0) {
        console.log('🔍 TTS: First non-intro segment:', {
          text: nonIntroSegments[0].text.substring(0, 50) + '...',
          element: nonIntroSegments[0].element,
          elementTagName: nonIntroSegments[0].element?.tagName
        });
        
        // Test highlighting on the first non-intro segment
        if (nonIntroSegments[0].element) {
          console.log('🧪 TTS: Testing highlight on first non-intro segment');
          this.highlightSegment(nonIntroSegments[0]);
          
          setTimeout(() => {
            this.removeHighlight();
            console.log('🧪 TTS: Test highlight removed');
          }, 3000);
        }
      }
    },

    tryWithDefaultVoice() {
      console.log('TTS: Trying with browser default voice as fallback');
      
      // Show a helpful warning about voice fallback
      notifications.warning('Switching to default voice for better compatibility');
      
      if (this.currentSegmentIndex < this.textSegments.length) {
        const segment = this.textSegments[this.currentSegmentIndex];
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Don't set a specific voice - let browser use default
        utterance.rate = this.playbackRate;
        utterance.pitch = this.pitch;
        utterance.volume = 1.0;
        
        console.log('TTS: Fallback utterance created for:', segment.text.substring(0, 50) + '...');
        console.log('TTS: Fallback utterance voice:', utterance.voice);
        
        utterance.onstart = () => {
          console.log('TTS: Fallback utterance started successfully');
          this.currentSegmentIndex = 0; // Reset to first segment
          this.highlightSegment(segment);
          this.updateProgress();
          // Continue with original utterances but without explicit voice
          this.continueWithDefaultVoice();
        };
        
        utterance.onerror = (event) => {
          console.error('TTS: Fallback utterance also failed:', event.error);
          notifications.error('Speech synthesis failed completely. Please check your audio settings.');
          this.stop();
        };
        
        speechSynthesis.speak(utterance);
        console.log('TTS: Fallback speak() called');
      }
    },
    
    continueWithDefaultVoice() {
      console.log('TTS: Recreating utterances without explicit voice setting');
      
      // Recreate all utterances without explicit voice
      this.utterances = this.textSegments.map((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Don't set voice - use browser default
        utterance.rate = this.playbackRate;
        utterance.pitch = this.pitch;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
          console.log(`TTS: Default voice started segment ${index}:`, segment.text.substring(0, 30) + '...');
          this.currentSegmentIndex = index;
          this.highlightSegment(segment);
          this.updateProgress();
        };
        
        utterance.onend = () => {
          console.log(`TTS: Default voice finished segment ${index}`);
          this.removeHighlight();
          // Continue to next segment
          if (this.isPlaying && index < this.textSegments.length - 1) {
            this.currentSegmentIndex++;
            if (this.currentSegmentIndex < this.utterances.length) {
              speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
            }
          } else if (index === this.textSegments.length - 1) {
            this.stop();
            notifications.success('Finished reading the article');
          }
        };
        
        utterance.onerror = (event) => {
          console.error(`TTS: Default voice error for segment ${index}:`, event.error);
          notifications.error(`Speech error: ${event.error}`);
        };
        
        return utterance;
      });
      
      // Start playing from segment 1 (since we already played segment 0 as test)
      this.currentSegmentIndex = 1;
      if (this.currentSegmentIndex < this.utterances.length) {
        speechSynthesis.speak(this.utterances[this.currentSegmentIndex]);
      }
    },

    // Getters
    get canGoPrevious() {
      return this.isInitialized && this.currentSegmentIndex > 0;
    },

    get canGoNext() {
      return this.isInitialized && this.currentSegmentIndex < this.utterances.length - 1;
    },

    get playButtonIcon() {
      return this.isPlaying ? 'icon-[tabler--player-pause]' : 'icon-[tabler--player-play]';
    },

    get progressWidth() {
      return `${this.progress}%`;
    }
  });
});

// Prevent multiple initialization calls
let ttsInitialized = false;

// Initialize TTS after Alpine has fully started
document.addEventListener('alpine:initialized', () => {
  // Initialize TTS on blog post pages
  if (!ttsInitialized && Alpine.store && Alpine.store('tts')) {
    ttsInitialized = true;
    Alpine.store('tts').init();
  }
});

Alpine.start()