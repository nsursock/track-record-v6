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


  // If you have other `addPlugin` calls, it's important that UpgradeHelper is added last.
	// eleventyConfig.addPlugin(UpgradeHelper);

  /* --- COLLECTIONS --- */
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .map(post => {
        // Ensure tags are properly processed
        if (post.data.tags && Array.isArray(post.data.tags)) {
          // Remove 'post' tag if it exists
          post.data.tags = post.data.tags.filter(tag => tag !== 'post');
        }
        return post;
      })
      .sort((a, b) => {
        // Sort by published_date in descending order (newest first)
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