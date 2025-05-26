import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

async function generateRatings() {
  try {
    console.log('🎯 Generating article ratings from evaluation files...');
    
    // Read evaluation files from the eval directory
    const evalDir = path.join(process.cwd(), 'src/data/eval');
    
    if (!fs.existsSync(evalDir)) {
      console.error('❌ Evaluation directory not found:', evalDir);
      process.exit(1);
    }
    
    const evalFiles = fs.readdirSync(evalDir)
      .filter(file => file.endsWith('.json'))
      .filter(file => !file.startsWith('.'));
    
    if (evalFiles.length === 0) {
      console.error('❌ No evaluation files found in:', evalDir);
      process.exit(1);
    }
    
    console.log(`📁 Found ${evalFiles.length} evaluation files`);
    
    const ratingsData = {};
    
    for (const file of evalFiles) {
      try {
        const filePath = path.join(evalDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const evaluation = JSON.parse(fileContent);
        
        // Extract slug from filename (remove .json extension)
        const slug = file.replace('.json', '');
        
        // Use the evaluation data directly - it already has the correct structure
        ratingsData[slug] = {
          title: evaluation.title,
          criteria: evaluation.criteria,
          overall_rating: evaluation.overall_rating,
          overall_assessment: evaluation.overall_assessment
        };
        
        console.log(`✅ Loaded evaluation for: ${evaluation.title}`);
      } catch (fileError) {
        console.error(`❌ Error reading evaluation file ${file}:`, fileError.message);
      }
    }
    
    if (Object.keys(ratingsData).length === 0) {
      console.error('❌ No valid evaluation data found');
      process.exit(1);
    }
    
    // Save ratings data as YAML file in data directory
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const ratingsPath = path.join(dataDir, 'ratings.yml');
    const yamlContent = yaml.dump(ratingsData, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true 
    });
    
    fs.writeFileSync(ratingsPath, yamlContent);
    
    console.log(`🎉 Successfully generated ratings for ${Object.keys(ratingsData).length} articles`);
    console.log(`📁 Saved to: ${ratingsPath}`);
    
    // Also create a summary for verification
    console.log('\n📊 Rating Summary:');
    
    // Get published dates for articles to enable proper secondary sorting
    const articlesWithDates = Object.entries(ratingsData).map(([slug, data]) => {
      let publishedDate = null;
      try {
        const postPath = path.join(process.cwd(), 'src/posts', `${slug}.md`);
        if (fs.existsSync(postPath)) {
          const fileContent = fs.readFileSync(postPath, 'utf8');
          const frontMatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const frontMatter = yaml.load(frontMatterMatch[1]);
            publishedDate = frontMatter.published_date;
          }
        }
      } catch (error) {
        console.warn(`Could not read date for ${slug}:`, error.message);
      }
      
      return {
        slug,
        data,
        publishedDate: publishedDate ? new Date(publishedDate) : new Date(0)
      };
    });
    
    const sortedByRating = articlesWithDates
      .sort((a, b) => {
        if (b.data.overall_rating !== a.data.overall_rating) {
          return b.data.overall_rating - a.data.overall_rating;
        }
        // Secondary sort by date (newest first) when ratings are equal
        return b.publishedDate - a.publishedDate;
      })
      .slice(0, 5);
    
    console.log('Top 5 rated articles:');
    sortedByRating.forEach((article, index) => {
      console.log(`${index + 1}. ${article.data.title} (${article.data.overall_rating}/5.0)`);
    });
    
  } catch (error) {
    console.error('❌ Error generating ratings:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRatings();
}

export default generateRatings; 