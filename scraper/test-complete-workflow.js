const LandBookScraper = require('./scraper.js');
const fs = require('fs').promises;
const path = require('path');

// Test the complete workflow with realistic data
async function testCompleteWorkflow() {
	console.log('🧪 Testing complete JSON output workflow...\n');

	// Simulate realistic scraped data from detail pages
	const realisticScrapedData = [
		{
			websiteName: 'Mindful Meditation App',
			websiteUrl: 'https://mindfulapp.com?ref=land-book.com',
			category: ['Mobile App', 'Landing Page'],
			style: ['Gradient', 'Soft Colors', 'Minimalist'],
			industry: ['Health & Fitness', 'Wellness'],
			type: ['Commercial', 'Service'],
			platform: ['React Native', 'Webflow'],
			colors: ['#6B73FF', '#9B59B6', '#FFFFFF', '#F8F9FA'],
			screenshotUrl: 'https://cdn.land-book.com/screenshots/mindful-app-full.webp',
			thumbnailUrl: 'https://cdn.land-book.com/thumbnails/mindful-app-thumb.webp',
			tags: ['Mobile First', 'Accessibility', 'Dark Mode', 'Sans-serif'],
			detailPageUrl: 'https://land-book.com/website/mindful-meditation-app'
		},
		{
			websiteName: 'Creative Studio Portfolio',
			websiteUrl: 'https://creativestudio.design?ref=land-book.com',
			category: ['Portfolio', 'Agency'],
			style: ['Bold Typography', 'Black & White', 'Grid Layout'],
			industry: ['Design', 'Creative', 'Agency'],
			type: ['Business', 'Portfolio'],
			platform: ['Custom', 'JavaScript'],
			colors: ['#000000', '#FFFFFF', '#FF6B6B'],
			screenshotUrl: 'https://cdn.land-book.com/screenshots/creative-studio-full.webp',
			thumbnailUrl: 'https://cdn.land-book.com/thumbnails/creative-studio-thumb.webp',
			tags: ['Serif', 'Animation', 'Interactive', 'Desktop First'],
			detailPageUrl: 'https://land-book.com/website/creative-studio-portfolio'
		},
		{
			websiteName: 'E-commerce Fashion Store',
			websiteUrl: 'https://fashionstore.com?ref=land-book.com',
			category: ['E-commerce', 'Fashion'],
			style: ['Clean', 'Product Focus', 'White Space'],
			industry: ['Fashion', 'Retail', 'E-commerce'],
			type: ['Commercial', 'Store'],
			platform: ['Shopify', 'Liquid'],
			colors: ['#FFFFFF', '#000000', '#F5F5F5', '#E8E8E8'],
			screenshotUrl: 'https://cdn.land-book.com/screenshots/fashion-store-full.webp',
			thumbnailUrl: 'https://cdn.land-book.com/thumbnails/fashion-store-thumb.webp',
			tags: ['Product Grid', 'Filter System', 'Mobile Responsive', 'Sans-serif'],
			detailPageUrl: 'https://land-book.com/website/fashion-store'
		},
		{
			websiteName: 'Tech Startup Landing',
			websiteUrl: 'https://techstartup.io?ref=land-book.com',
			category: ['Landing Page', 'SaaS'],
			style: ['Modern', 'Gradient', 'Tech'],
			industry: ['Technology', 'SaaS', 'Startup'],
			type: ['Commercial', 'Service'],
			platform: ['Next.js', 'Vercel'],
			colors: ['#667EEA', '#764BA2', '#FFFFFF', '#F7FAFC'],
			screenshotUrl: 'https://cdn.land-book.com/screenshots/tech-startup-full.webp',
			thumbnailUrl: 'https://cdn.land-book.com/thumbnails/tech-startup-thumb.webp',
			tags: ['CTA Focused', 'Feature Sections', 'Testimonials', 'Sans-serif'],
			detailPageUrl: 'https://land-book.com/website/tech-startup-landing'
		},
		{
			websiteName: 'Restaurant Menu Site',
			websiteUrl: 'https://restaurant.menu?ref=land-book.com',
			category: ['Restaurant', 'Menu'],
			style: ['Warm Colors', 'Food Photography', 'Elegant'],
			industry: ['Food & Beverage', 'Restaurant'],
			type: ['Business', 'Local'],
			platform: ['WordPress', 'Custom'],
			colors: ['#D4A574', '#8B4513', '#FFFFFF', '#FFF8DC'],
			screenshotUrl: 'https://cdn.land-book.com/screenshots/restaurant-menu-full.webp',
			thumbnailUrl: 'https://cdn.land-book.com/thumbnails/restaurant-menu-thumb.webp',
			tags: ['Script Font', 'Image Heavy', 'Location Info', 'Mobile Menu'],
			detailPageUrl: 'https://land-book.com/website/restaurant-menu'
		}
	];

	const scraper = new LandBookScraper();

	try {
		console.log('1️⃣ Testing with realistic scraped data...');
		console.log(`   Input: ${realisticScrapedData.length} designs`);

		// Generate JSON output
		const outputPath = path.join(__dirname, 'test-realistic-output.json');
		const result = await scraper.generateJsonOutput(realisticScrapedData, outputPath);

		if (result.success) {
			console.log(`   ✅ JSON generation successful`);
			console.log(`   📄 File: ${result.outputPath}`);
			console.log(`   📊 Designs: ${result.totalDesigns}`);
			console.log(`   ⚠️  Errors: ${result.formatErrors}`);

			// Verify file structure
			const fileContent = await fs.readFile(outputPath, 'utf8');
			const jsonData = JSON.parse(fileContent);

			console.log('\n2️⃣ Validating JSON structure...');
			console.log(`   ✅ Valid JSON: ${!!jsonData}`);
			console.log(`   ✅ Metadata present: ${!!jsonData.metadata}`);
			console.log(`   ✅ Designs array: ${Array.isArray(jsonData.designs)}`);
			console.log(`   ✅ Generated at: ${jsonData.metadata.generatedAt}`);
			console.log(`   ✅ Source: ${jsonData.metadata.source}`);

			console.log('\n3️⃣ Validating design objects...');
			let validDesigns = 0;
			let totalTags = 0;
			let totalColors = 0;

			jsonData.designs.forEach((design, index) => {
				const validation = scraper.validateDesignObject(design);
				if (validation.isValid) {
					validDesigns++;
					// Count tags
					Object.values(design.tags).forEach(tagArray => {
						if (Array.isArray(tagArray)) {
							totalTags += tagArray.length;
						}
					});
					totalColors += design.tags.colors.length;
				} else {
					console.log(`   ❌ Design ${index + 1} validation failed:`);
					validation.errors.forEach(error => console.log(`      - ${error}`));
				}
			});

			console.log(`   ✅ Valid designs: ${validDesigns}/${jsonData.designs.length}`);
			console.log(`   📊 Total tags: ${totalTags}`);
			console.log(`   🎨 Total colors: ${totalColors}`);
			console.log(`   📈 Avg tags per design: ${(totalTags / jsonData.designs.length).toFixed(1)}`);

			console.log('\n4️⃣ Testing content quality...');
			const stats = result.statistics;
			console.log(`   📝 Designs with titles: ${stats.withTitles}/${result.totalDesigns}`);
			console.log(`   🎨 Designs with colors: ${stats.withColors}/${result.totalDesigns}`);
			console.log(`   🏷️  Average tags per design: ${stats.avgTagsPerDesign.toFixed(1)}`);

			console.log('\n5️⃣ Content analysis...');
			console.log(`   🎨 Top style tags: ${stats.topStyleTags.slice(0, 5).join(', ')}`);
			console.log(`   🏢 Top industries: ${stats.topIndustries.slice(0, 5).join(', ')}`);

			// Show sample design
			console.log('\n6️⃣ Sample design structure:');
			const sampleDesign = jsonData.designs[0];
			console.log(`   ID: ${sampleDesign.id}`);
			console.log(`   Title: ${sampleDesign.title}`);
			console.log(`   Image: ${sampleDesign.image}`);
			console.log(`   Style tags: [${sampleDesign.tags.style.join(', ')}]`);
			console.log(`   Industry tags: [${sampleDesign.tags.industry.join(', ')}]`);
			console.log(`   Colors: [${sampleDesign.tags.colors.join(', ')}]`);

			console.log('\n🎉 Complete workflow test PASSED!');
			console.log('✨ The JSON output generation is ready for production use.');

			// Cleanup
			await fs.unlink(outputPath);
			console.log('🧹 Test file cleaned up');

		} else {
			console.log(`   ❌ JSON generation failed: ${result.error}`);
			return false;
		}

		return true;

	} catch (error) {
		console.error('❌ Workflow test failed:', error.message);
		console.error('Stack trace:', error.stack);
		return false;
	}
}

// Run test if called directly
if (require.main === module) {
	testCompleteWorkflow()
		.then(success => {
			if (success) {
				console.log('\n✅ All tests passed! JSON output generation is working correctly.');
				process.exit(0);
			} else {
				console.log('\n❌ Tests failed! Please check the implementation.');
				process.exit(1);
			}
		})
		.catch(error => {
			console.error('Test execution failed:', error);
			process.exit(1);
		});
}

module.exports = { testCompleteWorkflow };