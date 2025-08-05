#!/usr/bin/env node

/**
 * HTML Website Extractor
 * Extracts website data from saved Land-book HTML files
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class HTMLWebsiteExtractor {
	constructor() {
		this.websites = [];
		this.errors = [];
	}

	/**
	 * Extract website data from saved HTML file
	 * @param {string} htmlFilePath - Path to the saved HTML file
	 * @returns {Promise<Object>} - Extraction results
	 */
	async extractFromHTML(htmlFilePath) {
		console.log(`🔍 Extracting websites from: ${htmlFilePath}`);

		try {
			// Read the HTML file
			const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

			// Parse with JSDOM
			const dom = new JSDOM(htmlContent);
			const document = dom.window.document;

			// Find the websites container
			const websitesContainer = document.querySelector('#websites.websites');
			if (!websitesContainer) {
				throw new Error('Could not find #websites.websites container');
			}

			// Find all website item wrappers
			const websiteItems = websitesContainer.querySelectorAll('.website-item-wrapper');
			console.log(`📊 Found ${websiteItems.length} website items`);

			// Extract data from each item
			for (let i = 0; i < websiteItems.length; i++) {
				const item = websiteItems[i];
				const websiteData = this.extractWebsiteData(item, i);

				if (websiteData) {
					this.websites.push(websiteData);
					console.log(`   ✅ ${i + 1}. ${websiteData.name}`);
				} else {
					console.log(`   ❌ ${i + 1}. Failed to extract data`);
				}
			}

			console.log(`\n✅ Extraction completed: ${this.websites.length} websites extracted`);

			return {
				success: true,
				websites: this.websites,
				totalFound: websiteItems.length,
				extracted: this.websites.length,
				errors: this.errors
			};

		} catch (error) {
			console.error(`❌ Error extracting from HTML: ${error.message}`);
			return {
				success: false,
				error: error.message,
				websites: [],
				errors: this.errors
			};
		}
	}

	/**
	 * Extract data from a single website item
	 * @param {Element} item - The website-item-wrapper element
	 * @param {number} index - Index for debugging
	 * @returns {Object|null} - Extracted website data
	 */
	extractWebsiteData(item, index) {
		try {
			// Skip advertisement items
			const adElement = item.querySelector('.website-item-campaign');
			if (adElement) {
				console.log(`   🚫 ${index + 1}. Skipping advertisement`);
				return null;
			}

			// Extract the main link (post URL)
			const linkElement = item.querySelector('a[data-website-path]');
			if (!linkElement) {
				this.errors.push(`Item ${index + 1}: No main link found`);
				return null;
			}

			const postUrl = linkElement.href;
			const websitePath = linkElement.getAttribute('data-website-path');

			// Extract the name
			const nameElement = item.querySelector('a.d-block.m-0.fw-bold.text-truncate.text-800.text-decoration-none');
			if (!nameElement) {
				this.errors.push(`Item ${index + 1}: No name element found`);
				return null;
			}

			const name = nameElement.textContent.trim();

			// Extract the thumbnail image
			const imgElement = item.querySelector('img.img-fluid.website-item-height');
			let thumbnailImage = null;
			let localImagePath = null;

			if (imgElement) {
				thumbnailImage = imgElement.src;

				// Convert to local path if it's a relative path
				if (thumbnailImage.startsWith('./')) {
					localImagePath = thumbnailImage;
					// Extract just the filename for potential use
					const filename = path.basename(thumbnailImage);
					localImagePath = `./health-coach_files/${filename}`;
				}
			}

			// Extract category if available
			let category = null;
			const categoryElement = item.querySelector('small.text-truncated a');
			if (categoryElement) {
				category = categoryElement.textContent.trim();
			}

			// Generate a unique ID based on the website path
			let id = null;
			if (websitePath) {
				// Extract ID from path like "/websites/82056-seriant-advancing-cutting-edge-science..."
				const pathMatch = websitePath.match(/\/websites\/(\d+)-/);
				if (pathMatch) {
					id = `website_${pathMatch[1]}`;
				}
			}

			if (!id) {
				// Fallback ID generation
				id = `website_${index + 1}`;
			}

			return {
				id: id,
				name: name,
				postUrl: postUrl,
				websitePath: websitePath,
				thumbnailImage: thumbnailImage,
				localImagePath: localImagePath,
				category: category,
				index: index + 1
			};

		} catch (error) {
			this.errors.push(`Item ${index + 1}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Save extracted data to JSON file
	 * @param {string} outputPath - Path to save the JSON file
	 * @returns {Promise<boolean>} - Success status
	 */
	async saveToJSON(outputPath) {
		try {
			const outputData = {
				metadata: {
					extractedAt: new Date().toISOString(),
					totalWebsites: this.websites.length,
					source: 'saved-html-extraction',
					errors: this.errors.length
				},
				websites: this.websites,
				errors: this.errors
			};

			fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
			console.log(`💾 Saved ${this.websites.length} websites to: ${outputPath}`);

			return true;
		} catch (error) {
			console.error(`❌ Error saving to JSON: ${error.message}`);
			return false;
		}
	}

	/**
	 * Generate summary statistics
	 */
	generateSummary() {
		const summary = {
			totalExtracted: this.websites.length,
			withThumbnails: this.websites.filter(w => w.thumbnailImage).length,
			withCategories: this.websites.filter(w => w.category).length,
			categories: [...new Set(this.websites.map(w => w.category).filter(Boolean))],
			errors: this.errors.length
		};

		console.log('\n📊 Extraction Summary:');
		console.log(`   Total websites: ${summary.totalExtracted}`);
		console.log(`   With thumbnails: ${summary.withThumbnails}`);
		console.log(`   With categories: ${summary.withCategories}`);
		console.log(`   Unique categories: ${summary.categories.length}`);
		console.log(`   Errors: ${summary.errors}`);

		if (summary.categories.length > 0) {
			console.log(`   Categories found: ${summary.categories.join(', ')}`);
		}

		return summary;
	}
}

/**
 * Main execution function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log('Usage: node extract-websites.js <html-file> [output-file]');
		console.log('Example: node extract-websites.js health-coach.html websites-list.json');
		process.exit(1);
	}

	const htmlFile = args[0];
	const outputFile = args[1] || 'websites-list.json';

	// Check if HTML file exists
	if (!fs.existsSync(htmlFile)) {
		console.error(`❌ HTML file not found: ${htmlFile}`);
		process.exit(1);
	}

	console.log('🚀 HTML Website Extractor');
	console.log('='.repeat(50));

	const extractor = new HTMLWebsiteExtractor();

	// Extract websites from HTML
	const result = await extractor.extractFromHTML(htmlFile);

	if (!result.success) {
		console.error(`❌ Extraction failed: ${result.error}`);
		process.exit(1);
	}

	// Generate summary
	extractor.generateSummary();

	// Save to JSON
	const saved = await extractor.saveToJSON(outputFile);

	if (saved) {
		console.log(`\n✅ Extraction completed successfully!`);
		console.log(`📄 Website list saved to: ${outputFile}`);
		console.log(`\nNext steps:`);
		console.log(`1. Review the generated ${outputFile} file`);
		console.log(`2. Use this list to scrape detailed metadata from each website`);
	} else {
		console.error(`❌ Failed to save results`);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main().catch(error => {
		console.error('❌ Execution failed:', error);
		process.exit(1);
	});
}

module.exports = { HTMLWebsiteExtractor };