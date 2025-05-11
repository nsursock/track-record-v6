import path from 'path'
import pluginRss from "@11ty/eleventy-plugin-rss" // needed for absoluteUrl SEO feature
import eleventyNavigationPlugin from "@11ty/eleventy-navigation"
import EleventyVitePlugin from "@11ty/eleventy-plugin-vite"
import Image from "@11ty/eleventy-img"
import yaml from "js-yaml" // Because yaml is nicer than json for editors
import * as dotenv from 'dotenv'
import { DateTime } from "luxon"
import markdownIt from "markdown-it"
import markdownItAnchor from "markdown-it-anchor"
// import UpgradeHelper from "@11ty/eleventy-upgrade-help"

dotenv.config()

const baseUrl = process.env.BASE_URL || "http://localhost:8080"
console.log('baseUrl is set to ...', baseUrl)

const globalSiteData = {
  title: "Track Record",
  description: "A blog sharing deep insights and critiques on music, past and present.",
  locale: 'en',
  baseUrl: baseUrl,
}

export default function (eleventyConfig) {

  /* --- GLOBAL DATA --- */

  eleventyConfig.addGlobalData("site", globalSiteData);

  /* --- YAML SUPPORT --- */

  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));
  eleventyConfig.addDataExtension("yml", contents => yaml.load(contents));

  /* --- PASSTHROUGHS --- */

  eleventyConfig.addPassthroughCopy('src/assets/css')
  eleventyConfig.addPassthroughCopy('src/assets/js')


  /* --- PLUGINS --- */

  eleventyConfig.addPlugin(pluginRss); // just includes absolute url helper function
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(EleventyVitePlugin, {});

  /* --- SHORTCODES --- */

  // Image shortcode config
  let defaultSizesConfig = "(min-width: 1200px) 1400px, 100vw"; // above 1200px use a 1400px image at least, below just use 100vw sized image

  eleventyConfig.addShortcode("image", async function (src, alt, sizes = defaultSizesConfig) {
    console.log(`Generating image(s) from:  ${src}`)
    let metadata = await Image(src, {
      widths: [800, 1500],
      formats: ["webp", "jpeg"],
      urlPath: "/images/",
      outputDir: "./_site/images/",
      filenameFormat: function (id, src, width, format, options) {
        const extension = path.extname(src)
        const name = path.basename(src, extension)
        return `${name}-${width}w.${format}`
      }
    });

    let imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  });

  // Output year for copyright notices
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);


  /* --- FILTERS --- */

  // Custom Random Helper Filter (useful for ID attributes)
  eleventyConfig.addFilter("generateRandomIdString", function (prefix) {
    return prefix + "-" + Math.floor(Math.random() * 1000000);
  });

  // Date filter
  eleventyConfig.addFilter("date", function(date, format) {
    if (!date) return '';
    
    try {
      // Handle different date input types
      let dt;
      if (date instanceof Date) {
        dt = DateTime.fromJSDate(date);
      } else if (typeof date === 'string') {
        // Try parsing as ISO first
        dt = DateTime.fromISO(date);
        if (!dt.isValid) {
          // If ISO fails, try parsing as a regular date string
          dt = DateTime.fromFormat(date, 'yyyy-MM-dd');
        }
      } else {
        console.error('Unsupported date format:', date);
        return '';
      }
      
      if (!dt.isValid) {
        console.error('Invalid date:', dt.invalidReason);
        return '';
      }

      // Convert common format patterns to Luxon format tokens
      const formatMap = {
        'YYYY': 'yyyy',
        'MMMM D, YYYY': 'MMMM d, yyyy',
        'MMMM D': 'MMMM d',
        'D': 'd'
      };
      
      const luxonFormat = formatMap[format] || format;
      return dt.toFormat(luxonFormat);
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  });

  // Configure markdown-it
  const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true
  }).use(markdownItAnchor, {
    permalink: false,
    level: [2, 3, 4],
    slugify: (s) => s.toLowerCase().replace(/[^\w]+/g, '-'),
    uniqueSlugStartIndex: 1,
    tabIndex: false,
    callback: (token, anchor) => {
      // Add data-scrollspy-target attribute to headings
      token.attrSet('data-scrollspy-target', 'true');
    }
  });

  eleventyConfig.setLibrary("md", md);

  // Add custom filter for table of contents
  eleventyConfig.addFilter("toc", function(content) {
    const headings = [];
    const regex = /<h([2-3]) id="([^"]+)" data-scrollspy-target="true">([^<]+)<\/h\1>/g;
    let match;
    let currentH2 = null;

    while ((match = regex.exec(content)) !== null) {
      const [_, level, id, text] = match;
      
      if (level === "2") {
        currentH2 = {
          level: parseInt(level),
          id,
          text,
          children: []
        };
        headings.push(currentH2);
      } else if (level === "3" && currentH2) {
        currentH2.children.push({
          level: parseInt(level),
          id,
          text
        });
      }
    }

    return headings;
  });

  // Add custom filter to transform image URLs with Cloudinary
  eleventyConfig.addFilter("transformImage", function(url, isFirstImage = false) {
    if (!url) return url;
    
    // Check if the URL is already a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
      // If it's already a Cloudinary URL, add our transformations
      if (isFirstImage) {
        return url.replace('/upload/', '/upload/w_800,h_600,c_fill,q_80,f_jpg/');
      } else {
        return url.replace('/upload/', '/upload/w_320,h_240,c_fill,q_80,f_jpg/');
      }
    }
    
    // If it's not a Cloudinary URL, return as is
    return url;
  });

  // Add custom filter to extract first image not preceded by h2
  eleventyConfig.addFilter("extractFirstImage", function(content) {
    // First, find all h2 headings and their positions
    const h2Positions = [];
    const h2Regex = /<h2[^>]*>.*?<\/h2>/g;
    let h2Match;
    while ((h2Match = h2Regex.exec(content)) !== null) {
      h2Positions.push(h2Match.index);
    }

    // Then find all images
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
    let imgMatch;
    let firstImageFound = false;
    let contentWithoutFirstImage = content;

    while ((imgMatch = imgRegex.exec(content)) !== null) {
      const imgIndex = imgMatch.index;
      // Check if this image is before any h2 heading
      if (!firstImageFound && (h2Positions.length === 0 || h2Positions.every(h2Pos => imgIndex < h2Pos))) {
        const src = imgMatch[1];
        firstImageFound = true;
        
        // Handle Cloudinary URLs
        if (src.includes('res.cloudinary.com')) {
          // Extract the base URL without transformations or version
          const baseUrl = src.replace(/\/upload\/[^/]+\//, '/upload/');
          // Remove the first image from content
          contentWithoutFirstImage = content.replace(imgMatch[0], '');
          
          return {
            src: baseUrl,
            alt: imgMatch[2] || 'Hero image',
            content: contentWithoutFirstImage
          };
        }
        
        // Remove the first image from content
        contentWithoutFirstImage = content.replace(imgMatch[0], '');
        
        return {
          src: src,
          alt: imgMatch[2] || 'Hero image',
          content: contentWithoutFirstImage
        };
      }
    }
    return null; // Return null if no suitable image is found
  });

  // Add custom filter to transform images in markdown content
  eleventyConfig.addFilter("transformContentImages", function(content) {
    if (!content) return content;
    
    // Replace image URLs in markdown content
    return content.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, alt, url) => {
        // Handle Cloudinary URLs
        if (url.includes('res.cloudinary.com')) {
          // Extract the base URL without transformations or version
          const baseUrl = url.replace(/\/upload\/[^/]+\//, '/upload/');
          // Apply content image transformation
          return `![${alt}](${baseUrl.replace('/upload/', '/upload/w_320,h_240,c_fill,q_80,f_jpg/')})`;
        }
        
        return match;
      }
    );
  });

  // Add custom filter to extract first image from markdown content
  eleventyConfig.addFilter("matchImage", function(content) {
    if (!content) return null;
    
    // Convert content to string if it's not already
    const contentStr = typeof content === 'string' ? content : String(content);
    
    // First try to find markdown image syntax
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const markdownMatch = contentStr.match(markdownImageRegex);
    
    if (markdownMatch) {
      let url = markdownMatch[2];
      // Apply Cloudinary transformations if it's a Cloudinary URL
      if (url.includes('res.cloudinary.com')) {
        // Extract the base URL without transformations or version
        const baseUrl = url.replace(/\/upload\/[^/]+\//, '/upload/');
        // Apply card image transformation
        url = baseUrl.replace('/upload/', '/upload/w_480,h_320,c_fill,q_80,f_jpg/');
      }
      return {
        alt: markdownMatch[1],
        url: url
      };
    }
    
    // If no markdown image found, try to find HTML img tag
    const htmlImageRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/;
    const htmlMatch = contentStr.match(htmlImageRegex);
    
    if (htmlMatch) {
      let url = htmlMatch[1];
      // Apply Cloudinary transformations if it's a Cloudinary URL
      if (url.includes('res.cloudinary.com')) {
        // Extract the base URL without transformations or version
        const baseUrl = url.replace(/\/upload\/[^/]+\//, '/upload/');
        // Apply card image transformation
        url = baseUrl.replace('/upload/', '/upload/w_480,h_320,c_fill,q_80,f_jpg/');
      }
      return {
        alt: htmlMatch[2] || '',
        url: url
      };
    }
    
    return null;
  });

  // If you have other `addPlugin` calls, it's important that UpgradeHelper is added last.
  // eleventyConfig.addPlugin(UpgradeHelper);

  /* --- COLLECTIONS --- */
  eleventyConfig.addCollection("posts", async function(collectionApi) {
    const posts = await Promise.all(
      collectionApi.getFilteredByGlob("src/posts/*.md").map(async (post) => {
        // Store the raw content before markdown processing
        const rawContent = await post.template.read();
        post.rawContent = rawContent.content; // Access the content property
        
        // Ensure tags are properly processed
        if (post.data.tags && Array.isArray(post.data.tags)) {
          // Remove 'post' tag if it exists
          post.data.tags = post.data.tags.filter(tag => tag !== 'post');
        }
        return post;
      })
    );

    // Sort posts by published_date in descending order (newest first)
    return posts.sort((a, b) => {
      return new Date(b.data.published_date) - new Date(a.data.published_date);
    });
  });

  /* --- BASE CONFIG --- */

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes", // this path is releative to input-path (src/)
      layouts: "layouts", // this path is releative to input-path (src/)
      data: "data", // this path is releative to input-path (src/)
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}