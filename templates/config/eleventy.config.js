const markdownIt = require("markdown-it");
const htmlmin = require("html-minifier-terser");

module.exports = function(eleventyConfig) {
  // HTML Minification Transform
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyURLs: true
      });
    }
    return content;
  });

  // Static asset passthrough
  eleventyConfig.addPassthroughCopy({ "public": "." });
  
  // Watch for CSS and JS changes
  eleventyConfig.addWatchTarget("./src/styles/");
  eleventyConfig.addWatchTarget("./src/scripts/");
  
  // Set html suffix for Nunjucks templates
  eleventyConfig.setTemplateFormats([
    "md",
    "njk",
    "html"
  ]);
  
  // Customize Markdown renderer
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });
  eleventyConfig.setLibrary("md", markdownLibrary);
  
  // Collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/**/*.md").sort((a, b) => {
      return b.date - a.date; // Sort by date, newest first
    });
  });
  
  // Unique categories collection
  eleventyConfig.addCollection("categories", function(collectionApi) {
    const posts = collectionApi.getFilteredByGlob("src/posts/**/*.md");
    const categories = new Set();
    
    posts.forEach(post => {
      if (post.data.category) {
        // Normalize category to lowercase for consistency
        categories.add(post.data.category.toLowerCase());
      }
    });
    
    return Array.from(categories).sort();
  });
  
  // Custom date filter
  eleventyConfig.addFilter("readableDate", function(dateObj) {
    return dateObj.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  });

  // Format date filter (short format for articles)
  eleventyConfig.addFilter("formatDate", function(dateObj) {
    return dateObj.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  });
  
  // Reading time filter
  eleventyConfig.addFilter("readingTime", function(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  });
  
  return {
    dir: {
      input: "src",
      output: "dist", 
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};