# Text-to-Speech Feature for Blog Posts

## Overview

This feature allows users to listen to blog articles instead of reading them, making content accessible while driving, exercising, or when visual reading isn't convenient.

## Features

### 🎵 Audio Playback
- **Play/Pause Control**: Start and stop article narration
- **Skip Navigation**: Jump between article sections
- **Speed Control**: Adjust playback speed (0.5x to 2x)
- **Progress Tracking**: Visual progress bar showing reading progress

### 🎛️ Customization
- **Voice Selection**: Choose from available system voices
- **Pitch Control**: Adjust voice pitch for comfort
- **Text Highlighting**: Visual highlighting of currently read text
- **Auto-scroll**: Automatically scroll to the current reading position

### 📱 User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Floating Player**: Non-intrusive floating audio controls
- **Quick Access**: "Listen" buttons on blog post cards and individual posts
- **Auto-start**: Direct links with `?listen=true` parameter auto-start playback

## How to Use

### For Readers

1. **From Blog Index**: Click the "Listen" button on any blog post card
2. **From Article Page**: Click the "Listen to Article" button near the publication date
3. **Direct Link**: Share links with `?listen=true` to auto-start audio

### Controls

- **Play/Pause**: Main circular button in the center
- **Previous/Next**: Skip between article sections
- **Speed**: Dropdown to adjust reading speed
- **Settings**: Gear icon to access voice and preference options

## Technical Implementation

### Files Added/Modified

1. **`src/assets/js/components/text-to-speech.js`**: Main TTS component
2. **`src/assets/js/index.js`**: Added import for TTS component
3. **`src/layouts/post.njk`**: Added "Listen to Article" button
4. **`src/posts/index.njk`**: Added "Listen" buttons to post cards
5. **`src/assets/css/index.css`**: Added styling for TTS player

### Key Features

- **Web Speech API**: Uses browser's built-in speech synthesis
- **Text Extraction**: Intelligently extracts readable content, skipping navigation and code
- **Progressive Enhancement**: Gracefully degrades if speech synthesis isn't available
- **Accessibility**: Keyboard navigation and screen reader friendly

### Browser Support

- **Chrome/Edge**: Full support with high-quality voices
- **Firefox**: Basic support with system voices
- **Safari**: Good support on macOS/iOS
- **Mobile**: Works on modern mobile browsers

## Configuration

The TTS component can be customized by modifying options in `text-to-speech.js`:

```javascript
const options = {
  rate: 1.0,              // Default speech rate
  pitch: 1.0,             // Default pitch
  highlightText: true,    // Enable text highlighting
  autoScroll: true,       // Auto-scroll to current text
  skipImages: true,       // Skip image captions
  skipLinks: true         // Skip reading link URLs
};
```

## Accessibility Benefits

- **Visual Impairment**: Screen reader alternative for article content
- **Learning Differences**: Audio learning for dyslexia and other reading challenges
- **Multitasking**: Listen while performing other activities
- **Language Learning**: Hear pronunciation of words and phrases

## Future Enhancements

- **Voice Caching**: Save preferred voice settings
- **Playlist Mode**: Queue multiple articles
- **Bookmark Resume**: Resume from last position
- **Download Audio**: Generate MP3 files for offline listening
- **Social Sharing**: Share audio snippets on social media

## Troubleshooting

### No Voices Available
- Ensure browser supports Web Speech API
- Check system accessibility settings
- Try refreshing the page after changing system language

### Poor Audio Quality
- Update browser to latest version
- Check for enhanced voices in system settings
- Try different voice options in settings

### Text Not Reading
- Verify article has proper content structure
- Check that article isn't behind authentication
- Ensure JavaScript is enabled 