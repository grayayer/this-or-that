#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Transform the enhanced data into the format expected by the main This or That app
 */

async function transformEnhancedData() {
	console.log('🔄 Transforming enhanced data for main app...');

	try {
		// Read the enhanced data
		const enhancedData = JSON.parse(await fs.readFile('data/designs-enhanced.json', 'utf8'));

		// Transform each design to the expected format
		const transformedDesigns = enhancedData.designs.map(design => {
			// Clean up tags - remove duplicates and problematic entries
			let allTags = (design.tags || [])
				.filter(tag => tag && tag.trim() && tag !== ',' && !tag.includes('\t'))
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0 && tag.length < 50); // Remove overly long tags

			// Remove duplicates
			allTags = [...new Set(allTags)];

			// Categorize tags into the structure expected by the app
			const categorizedTags = {
				style: [],
				industry: [],
				typography: [],
				type: [],
				category: [],
				platform: [],
				colors: design.colors || []
			};

			// Categorize tags based on content
			allTags.forEach(tag => {
				const tagLower = tag.toLowerCase();

				// Style tags
				if (tagLower.match(/\b(background|gradient|parallax|animation|3d|cards|big footer|pastel|colors|people|video)\b/)) {
					categorizedTags.style.push(tag);
				}
				// Typography tags
				else if (tagLower.match(/\b(sans serif|serif|typography|font)\b/)) {
					categorizedTags.typography.push(tag);
				}
				// Industry tags
				else if (tagLower.match(/\b(health|fitness|medical|tech|business|education|ecommerce|food|drinks)\b/)) {
					categorizedTags.industry.push(tag);
				}
				// Platform tags
				else if (tagLower.match(/\b(webflow|wordpress|react|vue|angular|javascript)\b/)) {
					categorizedTags.platform.push(tag);
				}
				// Type/Category tags
				else if (tagLower.match(/\b(landing|template|portfolio|ecommerce|other|pro)\b/)) {
					categorizedTags.type.push(tag);
				}
				// Default to style if we can't categorize
				else {
					categorizedTags.style.push(tag);
				}
			});

			// Limit each category to reasonable numbers
			Object.keys(categorizedTags).forEach(category => {
				if (Array.isArray(categorizedTags[category])) {
					categorizedTags[category] = categorizedTags[category].slice(0, 6);
				}
			});

			// Get category - handle both array and string formats
			let category = 'Design';
			if (Array.isArray(design.category) && design.category.length > 0) {
				category = design.category[0];
			} else if (typeof design.category === 'string') {
				category = design.category;
			}

			// Update image path to be a proper relative URL for the web server
			const imageName = path.basename(design.image);
			const newImagePath = `./data/images/${imageName}`;

			return {
				id: design.id,
				name: design.name,
				description: design.description,
				image: newImagePath,
				category: category,
				tags: categorizedTags, // Now properly categorized
				colors: design.colors || [],
				websiteUrl: design.websiteUrl,
				source: design.source || 'land-book',
				sourceUrl: design.sourceUrl
			};
		});

		// Create the final data structure for the main app
		const mainAppData = {
			metadata: {
				generatedAt: new Date().toISOString(),
				totalDesigns: transformedDesigns.length,
				source: 'enhanced-json-scraper',
				version: '2.0.0',
				categories: [...new Set(transformedDesigns.map(d => d.category))].sort(),
				totalTags: [...new Set(transformedDesigns.flatMap(d => d.tags))].length,
				designsWithColors: transformedDesigns.filter(d => d.colors && d.colors.length > 0).length
			},
			designs: transformedDesigns
		};

		// Write to the main designs.json file
		await fs.writeFile('data/designs.json', JSON.stringify(mainAppData, null, 2));

		console.log('✅ Enhanced data transformed successfully!');
		console.log(`📊 Summary:`);
		console.log(`   • Total designs: ${mainAppData.designs.length}`);
		console.log(`   • Categories: ${mainAppData.metadata.categories.length}`);
		console.log(`   • Unique tags: ${mainAppData.metadata.totalTags}`);
		console.log(`   • Designs with colors: ${mainAppData.metadata.designsWithColors}`);

		// Show sample of transformed data
		console.log('\n🔍 Sample transformed designs:');
		mainAppData.designs.slice(0, 3).forEach((design, index) => {
			console.log(`\n   ${index + 1}. ${design.name}`);
			console.log(`      Category: ${design.category}`);

			// Show categorized tags
			const tagSummary = Object.entries(design.tags)
				.filter(([category, tags]) => Array.isArray(tags) && tags.length > 0)
				.map(([category, tags]) => `${category}: ${tags.length}`)
				.join(', ');
			console.log(`      Tags: ${tagSummary}`);
			console.log(`      Colors: ${design.colors.length} colors`);
			console.log(`      Image: ${design.image}`);
		});

		console.log('\n🎉 Main app data updated with enhanced rich tags!');
		console.log('💡 You can now run the main app with: open http://localhost:8000/index.html');

	} catch (error) {
		console.error('❌ Error transforming data:', error.message);
		throw error;
	}
}

// Run the transformation
if (require.main === module) {
	transformEnhancedData()
		.then(() => {
			console.log('\n✨ Transformation completed!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Transformation failed:', error);
			process.exit(1);
		});
}

module.exports = { transformEnhancedData };