# Article Ratings Dashboard

An AI-powered content analysis system that provides detailed ratings and feedback for blog articles using interactive UI components.

## Features

### 🌟 Interactive Rating System
- **Star Ratings**: Visual 1-5 star ratings for each criteria
- **Hover Tooltips**: Detailed strengths and suggestions on hover
- **Overall Badges**: Color-coded overall rating badges
- **Detailed Analysis Modal**: Comprehensive breakdown for each article

### 📊 Rating Criteria
1. **Writing Quality**: Grammar, clarity, style, and structure
2. **Originality**: Uniqueness, creativity, and fresh perspectives  
3. **Engagement**: Reader interest, accessibility, and relevance
4. **Depth**: Research quality, analysis thoroughness, and insights

### 🎨 UI Components (FlyonUI)
- Responsive table layout with zebra striping
- Loading states and smooth animations
- Modern card-based modal design
- Color-coded badges and notifications
- Hover effects and transitions

## File Structure

```
src/
├── pages/private/
│   └── article-ratings.njk     # Main dashboard page
├── data/
│   ├── article-ratings.json   # Generated ratings data
│   └── ai-analysis-prompt.md  # AI analysis documentation
└── posts/                     # Article source files

api/
├── ratings.json.js            # Ratings data API endpoint
└── generate-ratings.js        # AI rating generation endpoint
```

## Usage

### Accessing the Dashboard
Navigate to `/pages/private/article-ratings` to view the ratings dashboard.

### Generating Ratings
1. Click the "Generate AI Ratings" button
2. System analyzes all articles in `src/posts/`
3. Creates structured ratings data in JSON format
4. Updates table with interactive star ratings

### Viewing Details
- **Hover** over star ratings to see strengths and suggestions
- **Click** the eye icon to view comprehensive analysis
- **Review** detailed breakdown in modal popup

## Data Structure

### Article Rating Format
```json
{
  "article-slug": {
    "title": "Article Title",
    "criteria": {
      "writing_quality": {
        "score": 4.2,
        "strengths": ["Specific positive aspects"],
        "suggestions": ["Actionable improvements"]
      },
      "originality": { /* ... */ },
      "engagement": { /* ... */ },
      "depth": { /* ... */ }
    },
    "overall_rating": 4.1,
    "overall_assessment": "Comprehensive summary..."
  }
}
```

## AI Analysis Integration

### Mock Analysis (Current)
The system currently uses intelligent mock data generation with:
- Realistic scoring patterns
- Varied feedback libraries
- Article-specific adaptations

### Real AI Integration (Future)
To integrate with actual AI services:

1. **Update API Endpoint**: Modify `api/generate-ratings.js`
2. **Add AI Service**: Integrate OpenAI, Claude, or similar
3. **Use Prompt Template**: Apply the documented prompt from `ai-analysis-prompt.md`
4. **Handle API Keys**: Secure credential management

### Example AI Integration
```javascript
// In api/generate-ratings.js
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeArticle(title, content) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: AI_ANALYSIS_PROMPT },
      { role: "user", content: `Title: ${title}\n\nContent: ${content}` }
    ]
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

## Customization

### Adding New Criteria
1. Update the analysis prompt in `ai-analysis-prompt.md`
2. Modify table headers in `article-ratings.njk`
3. Add new rating display elements
4. Update JavaScript functions for new criteria

### Styling Modifications
- **Colors**: Modify badge classes in `generateOverallRating()`
- **Layout**: Update table structure and responsive classes
- **Animations**: Customize CSS transitions and hover effects

### Rating Scale Changes
- Update scoring logic in JavaScript functions
- Modify badge thresholds in `generateOverallRating()`
- Adjust prompt guidelines for new scale

## Technical Details

### Dependencies
- **FlyonUI**: UI component framework
- **TailwindCSS**: Utility-first CSS framework
- **Alpine.js**: Reactive JavaScript framework
- **11ty**: Static site generator
- **js-yaml**: YAML parsing for frontmatter

### Browser Compatibility
- Modern browsers with ES6+ support
- Mobile-responsive design
- Touch-friendly interactions

### Performance
- Lazy loading of ratings data
- Efficient DOM updates
- Minimal external dependencies

## Development

### Local Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Generate ratings
# Navigate to dashboard and click "Generate AI Ratings"
```

### Testing
- Test with different article types
- Verify responsive behavior
- Check tooltip positioning
- Validate modal interactions

## Future Enhancements

### Planned Features
- [ ] Bulk rating regeneration
- [ ] Rating history and trends
- [ ] Export capabilities (PDF, CSV)
- [ ] Filtering and sorting options
- [ ] Comparative analysis views

### Integration Possibilities
- [ ] Real AI service integration
- [ ] Automated scheduling for re-analysis
- [ ] Integration with content calendar
- [ ] Email notifications for low ratings
- [ ] SEO score integration

## Support

For questions or issues:
1. Check the AI prompt documentation
2. Review the sample data structure
3. Test with mock data first
4. Validate API endpoints are working

---

*This system provides a comprehensive foundation for AI-powered content analysis with room for extensive customization and enhancement.* 