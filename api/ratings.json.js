import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Get the project root directory
    const projectRoot = process.cwd();
    const ratingsPath = path.join(projectRoot, 'src/data/article-ratings.json');
    const evalFolderPath = path.join(projectRoot, 'src/data/eval');
    
    let ratingsData = {};
    
    // First, try to load from individual evaluation files in eval folder
    if (fs.existsSync(evalFolderPath)) {
      console.log('Reading individual evaluation files from:', evalFolderPath);
      
      const evalFiles = fs.readdirSync(evalFolderPath)
        .filter(file => file.endsWith('.json'))
        .filter(file => !file.startsWith('.'))
        .filter(file => {
          // Only include files directly in eval folder, not in subdirectories
          const filePath = path.join(evalFolderPath, file);
          const stats = fs.statSync(filePath);
          return stats.isFile(); // Only include actual files, not directories
        });
      
      console.log('Found evaluation files:', evalFiles);
      
      for (const file of evalFiles) {
        try {
          const filePath = path.join(evalFolderPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const evaluation = JSON.parse(fileContent);
          
          // Extract slug from filename (remove .json extension)
          const slug = file.replace('.json', '');
          
          // Add title to evaluation if not present
          if (!evaluation.title) {
            // Try to extract title from the evaluation data or use slug as fallback
            evaluation.title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          
          ratingsData[slug] = evaluation;
          console.log(`Loaded evaluation for: ${slug}`);
        } catch (fileError) {
          console.error(`Error reading evaluation file ${file}:`, fileError);
        }
      }
    }
    
    // Fallback to the main ratings file if no eval files found or as supplement
    if (Object.keys(ratingsData).length === 0 && fs.existsSync(ratingsPath)) {
      console.log('No eval files found, falling back to main ratings file:', ratingsPath);
      ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    } else if (fs.existsSync(ratingsPath)) {
      // Merge with existing ratings file if it exists
      console.log('Merging with existing ratings file:', ratingsPath);
      const existingRatings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
      ratingsData = { ...existingRatings, ...ratingsData };
    }
    
    if (Object.keys(ratingsData).length > 0) {
      console.log(`Serving ratings data for ${Object.keys(ratingsData).length} articles`);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(ratingsData);
    } else {
      console.log('No ratings data found');
      res.status(404).json({ error: 'No ratings data found' });
    }
  } catch (error) {
    console.error('Error reading ratings data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 