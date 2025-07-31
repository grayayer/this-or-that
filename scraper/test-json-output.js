const LandBookScraper = require('./scraper.js');
const fs = require('fs').promises;
const path = require('path');

// Test data that simulates scraped results
const mockScrapedData = [
	{
		websiteName: 'Modern Portfolio',
		websiteUrl: 'https://example.com?ref=land-book.com',
		category: ['Portfolio', 'Personal'],
		style: ['Minimalist', 'Clean', 'Modern'],
		industry: ['Design', 'Creative'],
		type: ['Personal'],
		platform: ['Webflow'],
		colors: ['#FFFFFF', '#000000', '#F5F5F5'],
		screenshotUrl: 'https://cdn.land-book.com/screenshot1.webp',
		thumbnailUrl: 'https://cdn.land-book.com/thumb1.webp',
		tags: ['Bold Typography', 'Grid Layout'],
		detailPageUrl: 'https://land-book.com/website/modern-portfolio'
	},
	{
		websiteName: 'Health App Landing',
		websiteUrl: 'https://healthapp.com?ref=land-book.com',
		category: ['Landing Page'],
		style: ['Colorful', 'Gradient'],
		industry: ['Health & Fitness', 'Technology'],
		type: ['Service', 'Commercial'],
		platform: ['React'],
		colors: ['#4A90E2', '#7ED321', '#FFFFFF'],
		screenshotUrl: 'https://cdn.land-book.com/screenshot2.webp',
		thumbnailUrl: 'https://cdn.land-book.com/thumb2.webp',
		tags: ['Mobile First', 'Responsive', 'Sans-serif'],
		detailPageUrl: 'https://land-book.com/website/health-app'
	},
	{
		// Test case with missing data
		websiteName: 'Incomplete Design',
		websiteUrl: null,
		category: [],
		style: ['Minimal'],
		industry: [],
		type: [],
		platform: [],
		colors: ['invalid-color', '#FF0000'], // Mix of valid and invalid colors
		screenshotUrl: null,
		thumbnailUrl: 'https://cdn.land-book.com/thumb3.webp',
		tags: ['', 'Valid Tag', null, 'Another Tag'], // Mix of valid and invalid tags
		detailPageUrl: 'https://land-book.com/website/incomplete'
	}
];

async function testJsonOutput() {
	console.log('🧪 Testing JSON output generation...\n');

	const scraper = new LandBookScraper();

	try {
		// Test individual design formatting
		console.log('1️⃣ Testing individual design formatting...');

		mockScrapedData.forEach((data, index) => {
			console.log(`\n   Testing design ${index + 1}: ${data.websiteName}`);
			const formatResult = scraper.formatDesignData(data, index);

			if (formatResult.success) {
				console.log(`   ✅ Format successful`);
				console.log(`      ID: ${formatResult.design.id}`);
				console.log(`      Image: ${formatResult.design.image ? 'Present' : 'Missing'}`);
				console.log(`      Title: ${formatResult.design.title || 'None'}`);
				console.log(`      Style tags: ${formatResult.design.tags.style.length}`);
				console.log(`      Colors: ${formatResult.design.tags.colors.length}`);

				// Test validation
				const validation = scraper.validateDesignObject(formatResult.design);
				console.log(`      Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
				if (!validation.isValid) {
					validation.errors.forEach(error => console.log(`         - ${error}`));
				}
			} else {
				console.log(`   ❌ Format failed: ${formatResult.error}`);
			}
		});

		// Test complete JSON output generation
		console.log('\n2️⃣ Testing complete JSON output generation...');

		const outputPath = path.join(__dirname, 'test-output.json');
		const jsonResult = await scraper.generateJsonOutput(mockScrapedData, outputPath);

		if (jsonResult.success) {
			console.log(`   ✅ JSON generation successful`);
			console.log(`      Output file: ${jsonResult.outputPath}`);
			console.log(`      Total designs: ${jsonResult.totalDesigns}`);
			console.log(`      Format errors: ${jsonResult.formatErrors}`);

			// Verify file was created and is valid JSON
			try {
				const fileContent = await fs.readFile(outputPath, 'utf8');
				const parsedJson = JSON.parse(fileContent);

				console.log(`   ✅ File created and contains valid JSON`);
				console.log(`      File size: ${(fileContent.length / 1024).toFixed(2)} KB`);
				console.log(`      Metadata present: ${!!parsedJson.metadata}`);
				console.log(`      Designs array length: ${parsedJson.designs?.length || 0}`);

				// Show sample design structure
				if (parsedJson.designs && parsedJson.designs.length > 0) {
					console.log(`\n   📋 Sample design structure:`);
					const sampleDesign = parsedJson.designs[0];
					console.log(`      ID: ${sampleDesign.id}`);
					console.log(`      Image: ${sampleDesign.image ? 'Present' : 'Missing'}`);
					console.log(`      Title: ${sampleDesign.title || 'None'}`);
					console.log(`      Tags categories: ${Object.keys(sampleDesign.tags).join(', ')}`);
					console.log(`      Style tags: [${sampleDesign.tags.style.slice(0, 3).join(', ')}${sampleDesign.tags.style.length > 3 ? '...' : ''}]`);
					console.log(`      Colors: [${sampleDesign.tags.colors.join(', ')}]`);
				}

			} catch (error) {
				console.log(`   ❌ File validation failed: ${error.message}`);
			}
		} else {
			console.log(`   ❌ JSON generation failed: ${jsonResult.error}`);
		}

		// Test statistics generation
		console.log('\n3️⃣ Testing statistics generation...');

		if (jsonResult.success && jsonResult.statistics) {
			const stats = jsonResult.statistics;
			console.log(`   ✅ Statistics generated`);
			console.log(`      Designs with titles: ${stats.withTitles}`);
			console.log(`      Designs with colors: ${stats.withColors}`);
			console.log(`      Average tags per design: ${stats.avgTagsPerDesign.toFixed(1)}`);
			console.log(`      Top style tags: ${stats.topStyleTags.slice(0, 3).join(', ')}`);
			console.log(`      Top industries: ${stats.topIndustries.slice(0, 3).join(', ')}`);
		}

		// Test edge cases
		console.log('\n4️⃣ Testing edge cases...');

		// Empty data
		const emptyResult = await scraper.generateJsonOutput([], path.join(__dirname, 'test-empty.json'));
		console.log(`   Empty data test: ${emptyResult.success ? '✅ Handled' : '❌ Failed'}`);

		// Invalid data
		const invalidData = [{ invalid: 'data' }, null, undefined];
		const invalidResult = await scraper.generateJsonOutput(invalidData, path.join(__dirname, 'test-invalid.json'));
		console.log(`   Invalid data test: ${invalidResult.success ? '✅ Handled' : '❌ Failed'}`);
		console.log(`      Format errors: ${invalidResult.formatErrors || 0}`);

		console.log('\n🎉 JSON output testing completed!');

		// Cleanup test files
		try {
			await fs.unlink(outputPath);
			await fs.unlink(path.join(__dirname, 'test-empty.json'));
			await fs.unlink(path.join(__dirname, 'test-invalid.json'));
			console.log('🧹 Test files cleaned up');
		} catch (error) {
			// Ignore cleanup errors
		}

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error('Stack trace:', error.stack);
	}
}

// Run tests if called directly
if (require.main === module) {
	testJsonOutput().catch(console.error);
}

module.exports = { testJsonOutput, mockScrapedData };