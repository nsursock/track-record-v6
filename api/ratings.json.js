import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Get the project root directory
    const projectRoot = process.cwd();
    const ratingsPath = path.join(projectRoot, 'src/data/article-ratings.json');
    
    console.log('Looking for ratings file at:', ratingsPath);
    
    if (fs.existsSync(ratingsPath)) {
      const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(ratingsData);
    } else {
      console.log('Ratings file not found at:', ratingsPath);
      res.status(404).json({ error: 'Ratings data not found' });
    }
  } catch (error) {
    console.error('Error reading ratings data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 