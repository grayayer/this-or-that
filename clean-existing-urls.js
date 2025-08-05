/**
 * Script to clean existing URLs in designs.json by removing ?ref=land-book.com parameters
 * This is a one-time cleanup script for the existing data
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Clean website URL by removing tracking parameters
 * @param {string} url - Original URL with tracking parameters
 * @returns {string} - Cleaned URL without tracking parameters
 */
function cleanWebsiteUrl(url) {
	if (!url) return url;

	try {
		const urlObj = new URL(url);
		// Remove the ref parameter specifically
		urlObj.searchParams.delete('ref');

		// If there are no search parameters left, return URL without query string
		if (urlObj.searchParams.toString() === '') {
			return urlObj.origin + urlObj.pathname;
		}

		return urlObj.toString();
	} catch (error) {
		console.warn('Failed to clean URL:', url, error.message);
		return url; // Return original URL if parsing fails
	}
}

async function cleanDesignsFile() {
	try {
		console.log('🧹 Cleaning URLs in designs.json...');

		// Read the current designs.json file
		const designsPath = path.join(__dirname, 'data', 'designs.json');
		const data = JSON.parse(await fs.readFile(designsPath, 'utf8'));

		if (!data.designs || !Array.isArray(data.designs)) {
			throw new Error('Invalid designs.json format');
		}

		let cleanedCount = 0;
		let totalUrls = 0;

		// Clean URLs in each design
		data.designs.forEach((design, index) => {
			if (design.websiteUrl) {
				totalUrls++;
				const originalUrl = design.websiteUrl;
				const cleanedUrl = cleanWebsiteUrl(originalUrl);

				if (originalUrl !== cleanedUrl) {
					design.websiteUrl = cleanedUrl;
					cleanedCount++;
					console.log(`   ${index + 1}. ${design.name || design.id}`);
					console.log(`      Before: ${originalUrl}`);
					console.log(`      After:  ${cleanedUrl}`);
				}
			}
		});

		// Write the cleaned data back to file
		if (cleanedCount > 0) {
			await fs.writeFile(designsPath, JSON.stringify(data, null, '\t'));
			console.log(`\n✅ Cleaned ${cleanedCount} URLs out of ${totalUrls} total URLs`);
			console.log(`📁 Updated designs.json file`);
		} else {
			console.log(`\n✅ All ${totalUrls} URLs are already clean - no changes needed`);
		}

	} catch (error) {
		console.error('❌ Error cleaning designs file:', error.message);
		process.exit(1);
	}
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
	cleanDesignsFile();
}

module.exports = { cleanWebsiteUrl, cleanDesignsFile };