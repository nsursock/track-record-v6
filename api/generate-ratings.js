import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// AI prompt for analyzing articles
const ANALYSIS_PROMPT = `
You are an expert content analyst. Your task is to analyze articles and provide detailed ratings based on the following criteria:

1. **Writing Quality** (1-5): Evaluate grammar, clarity, flow, and overall writing craftsmanship
2. **Originality** (1-5): Assess uniqueness of ideas, fresh perspectives, and creative insights
3. **Engagement** (1-5): Rate how compelling and interesting the content is for readers
4. **Depth** (1-5): Evaluate the thoroughness of analysis and intellectual rigor

For each criterion, provide:
- A numerical score (1-5, can use decimals like 4.2)
- 2-3 specific strengths
- 2-3 actionable suggestions for improvement

Also provide an overall rating (average of all criteria) and a brief overall assessment paragraph.

Return your analysis in this exact JSON format:
{
  "criteria": {
    "writing_quality": {
      "score": 4.2,
      "strengths": ["Clear and engaging prose", "Well-structured arguments"],
      "suggestions": ["Consider varying sentence length", "Add more concrete examples"]
    },
    "originality": {
      "score": 3.8,
      "strengths": ["Unique perspective on topic", "Creative analogies"],
      "suggestions": ["Explore more unconventional angles", "Challenge established assumptions"]
    },
    "engagement": {
      "score": 4.0,
      "strengths": ["Compelling introduction", "Relatable examples"],
      "suggestions": ["Add more interactive elements", "Include thought-provoking questions"]
    },
    "depth": {
      "score": 4.5,
      "strengths": ["Thorough research evident", "Complex ideas well-explained"],
      "suggestions": ["Consider additional perspectives", "Expand on implications"]
    }
  },
  "overall_rating": 4.1,
  "overall_assessment": "This article demonstrates strong analytical thinking and clear communication..."
}
`;

// Function to generate mock AI analysis (replace with actual AI service)
function generateMockAnalysis(article) {
  // Simulate AI analysis with realistic but randomized data
  const baseScores = {
    writing_quality: 3.5 + Math.random() * 1.5,
    originality: 3.0 + Math.random() * 2.0,
    engagement: 3.2 + Math.random() * 1.8,
    depth: 3.3 + Math.random() * 1.7
  };

  const strengths = {
    writing_quality: [
      "Clear and articulate prose",
      "Well-structured narrative flow",
      "Effective use of transitions",
      "Compelling voice and tone",
      "Strong paragraph organization"
    ],
    originality: [
      "Fresh perspective on familiar topics",
      "Innovative use of metaphors",
      "Unique synthesis of ideas",
      "Creative problem-solving approach",
      "Original insights and connections"
    ],
    engagement: [
      "Captivating opening hook",
      "Relatable examples and anecdotes",
      "Thought-provoking questions",
      "Compelling call to action",
      "Interactive narrative style"
    ],
    depth: [
      "Thorough exploration of concepts",
      "Well-researched supporting evidence",
      "Complex ideas made accessible",
      "Multiple perspectives considered",
      "Comprehensive analysis"
    ]
  };

  const suggestions = {
    writing_quality: [
      "Vary sentence structure for better rhythm",
      "Consider more concrete examples",
      "Strengthen transitions between sections",
      "Refine word choice for precision",
      "Polish conclusion for stronger impact"
    ],
    originality: [
      "Explore more unconventional angles",
      "Challenge established assumptions",
      "Incorporate diverse viewpoints",
      "Push boundaries of conventional thinking",
      "Develop unique frameworks or models"
    ],
    engagement: [
      "Add more interactive elements",
      "Include multimedia components",
      "Create stronger emotional connections",
      "Use more vivid storytelling",
      "Incorporate reader participation"
    ],
    depth: [
      "Expand on practical implications",
      "Include more supporting research",
      "Address potential counterarguments",
      "Provide detailed case studies",
      "Explore long-term consequences"
    ]
  };

  const criteria = {};
  
  Object.keys(baseScores).forEach(criterion => {
    const score = Math.round(baseScores[criterion] * 10) / 10; // Round to 1 decimal
    const criterionStrengths = strengths[criterion];
    const criterionSuggestions = suggestions[criterion];
    
    criteria[criterion] = {
      score: score,
      strengths: [
        criterionStrengths[Math.floor(Math.random() * criterionStrengths.length)],
        criterionStrengths[Math.floor(Math.random() * criterionStrengths.length)]
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      suggestions: [
        criterionSuggestions[Math.floor(Math.random() * criterionSuggestions.length)],
        criterionSuggestions[Math.floor(Math.random() * criterionSuggestions.length)]
      ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    };
  });

  const overallRating = Math.round((Object.values(baseScores).reduce((a, b) => a + b, 0) / 4) * 10) / 10;
  
  const assessments = [
    "This article demonstrates strong analytical thinking and clear communication. The author presents complex ideas in an accessible manner while maintaining intellectual rigor.",
    "A well-crafted piece that balances depth with readability. The author shows good command of the subject matter and presents arguments in a logical progression.",
    "This work showcases thoughtful analysis and engaging presentation. The writing flows naturally while addressing important themes with appropriate nuance.",
    "The article presents a compelling examination of its topic with clear structure and insightful observations. The author demonstrates both knowledge and communication skill.",
    "A solid piece of writing that effectively communicates its key messages. The author maintains reader interest while delivering substantive content."
  ];

  return {
    title: article.title,
    criteria: criteria,
    overall_rating: overallRating,
    overall_assessment: assessments[Math.floor(Math.random() * assessments.length)]
  };
}

export default async function handler(req, res) {
  try {
    // Read all articles from the posts directory
    const postsDir = path.join(process.cwd(), 'src/posts');
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    const ratingsData = {};
    
    for (const file of files) {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse front matter
      const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        const frontMatter = yaml.load(frontMatterMatch[1]);
        const slug = frontMatter.slug || file.replace('.md', '');
        
        // Generate analysis for this article
        const analysis = generateMockAnalysis({
          title: frontMatter.title,
          content: content.replace(frontMatterMatch[0], '').trim(),
          slug: slug
        });
        
        ratingsData[slug] = analysis;
      }
    }
    
    // Save ratings data to file
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const ratingsPath = path.join(dataDir, 'article-ratings.json');
    fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2));
    
    res.status(200).json({ 
      success: true, 
      message: 'Ratings generated successfully',
      articlesAnalyzed: Object.keys(ratingsData).length
    });
    
  } catch (error) {
    console.error('Error generating ratings:', error);
    res.status(500).json({ error: 'Failed to generate ratings', details: error.message });
  }
} 