import '../css/index.css';

import Alpine from 'alpinejs'
import "./signup.js"

window.Alpine = Alpine

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

// Testimonials Carousel
document.addEventListener('alpine:init', () => {
  Alpine.data('testimonials', () => ({
    currentIndex: 0,
    testimonials: [
      {
        id: 1,
        name: "Sarah Johnson",
        role: "Music Enthusiast",
        avatar: "https://i.pravatar.cc/150?img=1",
        text: "Track Record has completely transformed how I discover and organize my music. The playlist creation tools are intuitive and make it easy to create the perfect mix for any occasion. The music personality feature is spot on and has helped me discover artists I never would have found otherwise. I love how I can share my playlists with friends and see what they're listening to.",
        rating: 5,
        date: "2 days ago"
      },
      {
        id: 2,
        name: "Michael Chen",
        role: "DJ & Producer",
        avatar: "https://i.pravatar.cc/150?img=2",
        text: "As a DJ, I need to stay organized with my music collection. Track Record's playlist management and discovery features have been invaluable for my work. The analytics help me understand what tracks are resonating with my audience. I can easily create different playlists for different venues and events.",
        rating: 5,
        date: "1 week ago"
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        role: "Music Blogger",
        avatar: "https://i.pravatar.cc/150?img=3",
        text: "The music personality feature is incredibly accurate! It's helped me discover so many new artists that perfectly match my taste. The interface is beautiful and easy to use, making it simple to organize my music collection. I love how I can create different playlists for different moods and activities.",
        rating: 4.5,
        date: "2 weeks ago"
      },
      {
        id: 4,
        name: "David Wilson",
        role: "Music Teacher",
        avatar: "https://i.pravatar.cc/150?img=4",
        text: "I use Track Record to create playlists for my music classes. The sharing features make it easy to distribute music to my students, and the organization tools are perfect for lesson planning. The ability to add notes to each track helps me remember why I included it in the playlist.",
        rating: 5,
        date: "3 weeks ago"
      },
      {
        id: 5,
        name: "Lisa Thompson",
        role: "Podcast Host",
        avatar: "https://i.pravatar.cc/150?img=5",
        text: "The music discovery features have been a game-changer for my podcast. I can easily find new tracks that fit my show's theme and create playlists for each episode. The mood-based organization helps me find the perfect background music for different segments.",
        rating: 5,
        date: "1 month ago"
      },
      {
        id: 6,
        name: "James Miller",
        role: "Music Producer",
        avatar: "https://i.pravatar.cc/150?img=6",
        text: "The playlist organization and sharing features are top-notch. I can easily collaborate with other producers and share my work with clients. The ability to create different versions of playlists for different purposes has streamlined my workflow. Highly recommended!",
        rating: 4.5,
        date: "1 month ago"
      },
      {
        id: 7,
        name: "Alex Rivera",
        role: "Music Therapist",
        avatar: "https://i.pravatar.cc/150?img=7",
        text: "Track Record has revolutionized how I create therapeutic playlists for my clients. The mood-based organization and sharing features are perfect for my practice. I can easily create different playlists for different therapeutic goals and share them with my clients. The ability to add notes and track progress has been invaluable.",
        rating: 5,
        date: "3 days ago"
      },
      {
        id: 8,
        name: "Sophie Zhang",
        role: "Radio Host",
        avatar: "https://i.pravatar.cc/150?img=8",
        text: "The music discovery algorithm is brilliant! It's helped me find fresh tracks for my radio show that I wouldn't have discovered otherwise. The interface is sleek and professional, making it easy to organize my playlists. I love how I can create different playlists for different segments of my show.",
        rating: 4.5,
        date: "5 days ago"
      },
      {
        id: 9,
        name: "Carlos Mendez",
        role: "Music Store Owner",
        avatar: "https://i.pravatar.cc/150?img=9",
        text: "I use Track Record to curate playlists for my store. The analytics help me understand what's trending, and the sharing features make it easy to promote new releases. The ability to create different playlists for different sections of the store has improved the shopping experience for my customers.",
        rating: 5,
        date: "1 week ago"
      },
      {
        id: 10,
        name: "Aisha Patel",
        role: "Yoga Instructor",
        avatar: "https://i.pravatar.cc/150?img=10",
        text: "Creating the perfect yoga playlists has never been easier. The mood-based organization and seamless transitions between tracks are exactly what I needed for my classes. I can easily create different playlists for different types of yoga sessions. The ability to share playlists with my students has been a great addition to my teaching.",
        rating: 5,
        date: "2 weeks ago"
      },
      {
        id: 11,
        name: "Marcus O'Connor",
        role: "Music Journalist",
        avatar: "https://i.pravatar.cc/150?img=11",
        text: "As a music journalist, I need to stay on top of new releases. Track Record's discovery features and playlist organization have become essential tools for my work. The ability to create different playlists for different articles helps me stay organized. The sharing features make it easy to collaborate with other journalists.",
        rating: 4.5,
        date: "3 weeks ago"
      },
      {
        id: 12,
        name: "Nina Kowalski",
        role: "Event Planner",
        avatar: "https://i.pravatar.cc/150?img=12",
        text: "The playlist creation tools have transformed how I handle music for events. I can easily create and share playlists with clients, and the mood-based organization is perfect for different event types. The ability to create different versions of playlists for different parts of the event has been incredibly helpful.",
        rating: 5,
        date: "1 month ago"
      }
    ],
    
    getStarClass(rating, index) {
      if (index < rating) {
        return 'icon-[tabler--star]';
      } else if (index - 0.5 === rating) {
        return 'icon-[tabler--star-half]';
      } else {
        return 'icon-[tabler--star] opacity-30';
      }
    }
  }));
});

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

// Comments Component
document.addEventListener('alpine:init', () => {
  Alpine.data('comments', () => ({
    comments: [
      {
        id: 1,
        name: 'Sarah Johnson',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        date: '2 hours ago',
        content: 'This article really helped me understand the complexities of adolescent grief. The examples were particularly insightful.'
      },
      {
        id: 2,
        name: 'Michael Chen',
        avatar: 'https://i.pravatar.cc/150?u=michael',
        date: '3 hours ago',
        content: 'I appreciate how the article addresses both emotional and developmental aspects. Would love to see more content like this.'
      },
      {
        id: 3,
        name: 'Emma Rodriguez',
        avatar: 'https://i.pravatar.cc/150?u=emma',
        date: '5 hours ago',
        content: 'As a school counselor, I find these insights valuable for my work with grieving students.'
      },
      {
        id: 4,
        name: 'David Kim',
        avatar: 'https://i.pravatar.cc/150?u=david',
        date: '1 day ago',
        content: 'The section on developmental stages was particularly helpful. It gave me a new perspective on how to support grieving teens.'
      },
      {
        id: 5,
        name: 'Lisa Patel',
        avatar: 'https://i.pravatar.cc/150?u=lisa',
        date: '1 day ago',
        content: 'I wish I had read this when I was going through a similar situation. The coping strategies are practical and easy to implement.'
      },
      {
        id: 6,
        name: 'James Wilson',
        avatar: 'https://i.pravatar.cc/150?u=james',
        date: '2 days ago',
        content: 'The article does a great job of explaining complex emotions in an accessible way. Thank you for sharing this.'
      },
      {
        id: 7,
        name: 'Maria Garcia',
        avatar: 'https://i.pravatar.cc/150?u=maria',
        date: '2 days ago',
        content: 'I appreciate the focus on both emotional and practical aspects of grief. The resources section is particularly helpful.'
      },
      {
        id: 8,
        name: 'Alex Thompson',
        avatar: 'https://i.pravatar.cc/150?u=alex',
        date: '3 days ago',
        content: 'As a parent, this article helped me understand what my teenager might be going through. Very insightful.'
      },
      {
        id: 9,
        name: 'Sophie Anderson',
        avatar: 'https://i.pravatar.cc/150?u=sophie',
        date: '3 days ago',
        content: 'The section on peer support was eye-opening. It\'s something we should talk about more in schools.'
      },
      {
        id: 10,
        name: 'Ryan Martinez',
        avatar: 'https://i.pravatar.cc/150?u=ryan',
        date: '4 days ago',
        content: 'Great article! The practical tips for supporting grieving adolescents are particularly valuable.'
      }
    ]
  }));
});

// Header Component
document.addEventListener('alpine:init', () => {
  Alpine.data('header', () => ({
    user: null,
    isDropdownOpen: false,

    async init() {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session) {
          const response = await fetch('/api/credentials?action=profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            this.user = data.user;
          }
        }
      } catch (error) {
        console.error('Error:', error);
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

Alpine.start()