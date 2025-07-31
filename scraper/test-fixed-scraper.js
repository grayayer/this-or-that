const LandBookScraper = require('./scraper.js');

async function testFixedScraper() {
	console.log('🧪 Testing fixed scraper with correct URLs\n');
	console.log('🎯 Should now get rich taxonomy data from specific website pages\n');

	const scraper = new LandBookScraper({
		headless: true,
		maxItems: 3 // Just a few for testing
	});

	try {
		await scraper.initialize();

		const url = 'https://land-book.com/?industry=health-and-fitness';
		const urlInfo = {
			originalUrl: url,
			pageType: 'gallery',
			params: { industry: 'health-and-fitness' }
		};

		await scraper.navigateToUrl(urlInfo);

		console.log('1️⃣ Grid scraping with fixed URL extraction...');
		const gridResults = await scraper.scrapeGridPage();

		console.log(`   ✅ Found ${gridResults.items.length} items with correct URLs:`);
		gridResults.items.forEach((item, index) => {
			console.log(`      ${index + 1}. ${item.title}`);
			console.log(`         URL: ${item.detailUrl}`);
		});
		console.log('');

		console.log('2️⃣ Detail scraping from specific website pages...');
		const detailResults = await scraper.scrapeAllDetailPages(gridResults.items);

		console.log(`   ✅ Detail scraping: ${detailResults.successCount}/${detailResults.totalProcessed}\n`);

		console.log('3️⃣ Sample of scraped data (should be much richer now):');
		if (detailResults.results.length > 0) {
			const sample = detailResults.results[0];
			console.log(`   📝 Website: ${sample.websiteName}`);
			console.log(`   🔗 URL: ${sample.websiteUrl || 'Not found'}`);
			console.log(`   🏷️ Categories: [${sample.category?.join(', ') || 'None'}]`);
			console.log(`   🎨 Styles: [${sample.style?.join(', ') || 'None'}]`);
			console.log(`   🏢 Industries: [${sample.industry?.join(', ') || 'None'}]`);
			console.log(`   📱 Platforms: [${sample.platform?.join(', ') || 'None'}]`);
			console.log(`   🎨 Colors: [${sample.colors?.join(', ') || 'None'}]`);
			console.log(`   🏷️ Tags: [${sample.tags?.slice(0, 8).join(', ') || 'None'}]`);
			console.log(`   📸 Screenshot: ${sample.screenshotUrl ? 'Present' : 'Missing'}`);
		}
		console.log('');

		console.log('4️⃣ Generating JSON with improved data...');
		const jsonResult = await scraper.generateJsonOutput(detailResults.results, '../data/designs-fixed.json');

		if (jsonResult.success) {
			console.log(`   ✅ JSON generated: ${jsonResult.outputPath}`);
			console.log(`   📊 Designs: ${jsonResult.totalDesigns}`);
			console.log(`   ⚠️ Errors: ${jsonResult.formatErrors}`);

			if (jsonResult.statistics) {
				console.log(`\n   📊 Quality improvements:`);
				console.log(`      Designs with titles: ${jsonResult.statistics.withTitles}/${jsonResult.totalDesigns}`);
				console.log(`      Designs with colors: ${jsonResult.statistics.withColors}/${jsonResult.totalDesigns}`);
				console.log(`      Average tags per design: ${jsonResult.statistics.avgTagsPerDesign.toFixed(1)}`);
				console.log(`      Top style tags: ${jsonResult.statistics.topStyleTags.slice(0, 5).join(', ')}`);
				console.log(`      Top industries: ${jsonResult.statistics.topIndustries.slice(0, 5).join(', ')}`);
			}
		}

		console.log('\n🎉 Fixed scraper test completed!');
		return { success: true };

	} catch (error) {
		console.error(`❌ Test failed: ${error.message}`);
		return { success: false, error: error.message };
	} finally {
		await scraper.close();
	}
}

testFixedScraper().catch(console.error);