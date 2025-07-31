const LandBookScraper = require('./scraper.js');

async function fullScrapeDemo() {
	console.log('🎯 Full scrape demonstration with default settings\n');
	console.log('📍 Target: https://land-book.com/?industry=health-and-fitness');
	console.log('🔢 Limit: 20 designs (default free account limit)');
	console.log('⏱️ Expected time: 3-5 minutes with rate limiting\n');

	const scraper = new LandBookScraper({
		headless: true,  // Run in background
		maxItems: 20,    // Default limit for free accounts
		slowMo: 50       // Reasonable speed
	});

	try {
		// Initialize and navigate
		console.log('1️⃣ Initializing and navigating...');
		const initialized = await scraper.initialize();
		if (!initialized) throw new Error('Failed to initialize');

		const url = 'https://land-book.com/?industry=health-and-fitness';
		const urlInfo = {
			originalUrl: url,
			pageType: 'gallery',
			params: { industry: 'health-and-fitness' }
		};

		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) throw new Error('Failed to navigate');
		console.log('   ✅ Ready to scrape\n');

		// Scrape grid
		console.log('2️⃣ Scraping grid page...');
		const gridResults = await scraper.scrapeGridPage();
		if (!gridResults.success) throw new Error('Grid scraping failed');

		console.log(`   ✅ Found ${gridResults.items.length} designs from ${gridResults.totalFound} total`);
		console.log(`   📊 Valid items: ${gridResults.validItems}`);
		console.log(`   ⚠️ Error items: ${gridResults.errorItems}`);
		console.log(`   🖼️ Missing thumbnails: ${gridResults.noThumbnailItems}\n`);

		// Show first few items
		console.log('   📋 First 5 items found:');
		gridResults.items.slice(0, 5).forEach((item, index) => {
			console.log(`      ${index + 1}. ${item.title || 'Untitled'}`);
			console.log(`         URL: ${item.detailUrl.substring(0, 60)}...`);
		});
		console.log('');

		// Scrape details (this will take a while)
		console.log('3️⃣ Scraping detail pages...');
		console.log('   ⏱️ This will take 3-5 minutes with respectful rate limiting');
		console.log('   🤖 Being respectful to Land-book servers...\n');

		const detailResults = await scraper.scrapeAllDetailPages(gridResults.items);

		console.log(`\n   ✅ Detail scraping completed!`);
		console.log(`   📊 Success: ${detailResults.successCount}/${detailResults.totalProcessed}`);
		console.log(`   ⚠️ Errors: ${detailResults.errorCount}\n`);

		// Show sample of rich data
		if (detailResults.results.length > 0) {
			console.log('4️⃣ Sample of scraped data:');
			const sample = detailResults.results[0];
			console.log(`   📝 Website: ${sample.websiteName}`);
			console.log(`   🔗 URL: ${sample.websiteUrl || 'Not found'}`);
			console.log(`   🏷️ Categories: [${sample.category?.join(', ') || 'None'}]`);
			console.log(`   🎨 Styles: [${sample.style?.join(', ') || 'None'}]`);
			console.log(`   🏢 Industries: [${sample.industry?.join(', ') || 'None'}]`);
			console.log(`   🎨 Colors: [${sample.colors?.join(', ') || 'None'}]`);
			console.log(`   🏷️ Tags: [${sample.tags?.slice(0, 5).join(', ') || 'None'}]`);
			console.log('');
		}

		// Generate JSON
		console.log('5️⃣ Generating JSON output...');
		const jsonResult = await scraper.generateJsonOutput(detailResults.results, '../data/designs.json');

		if (jsonResult.success) {
			console.log(`   ✅ JSON generated successfully!`);
			console.log(`   📄 File: ${jsonResult.outputPath}`);
			console.log(`   📊 Total designs: ${jsonResult.totalDesigns}`);
			console.log(`   ⚠️ Format errors: ${jsonResult.formatErrors}`);

			if (jsonResult.statistics) {
				console.log(`\n   📊 Final Statistics:`);
				console.log(`      Designs with titles: ${jsonResult.statistics.withTitles}/${jsonResult.totalDesigns}`);
				console.log(`      Designs with colors: ${jsonResult.statistics.withColors}/${jsonResult.totalDesigns}`);
				console.log(`      Average tags per design: ${jsonResult.statistics.avgTagsPerDesign.toFixed(1)}`);
				console.log(`      Top style tags: ${jsonResult.statistics.topStyleTags.slice(0, 5).join(', ')}`);
				console.log(`      Top industries: ${jsonResult.statistics.topIndustries.slice(0, 5).join(', ')}`);
			}
		}

		console.log('\n🎉 Full scrape completed successfully!');
		console.log(`✨ Generated ${jsonResult.totalDesigns} designs for the This or That app`);

		return {
			success: true,
			totalDesigns: jsonResult.totalDesigns,
			gridItems: gridResults.items.length,
			detailSuccess: detailResults.successCount
		};

	} catch (error) {
		console.error(`❌ Full scrape failed: ${error.message}`);
		return { success: false, error: error.message };
	} finally {
		await scraper.close();
		console.log('🔄 Browser closed');
	}
}

// Run the full demo
if (require.main === module) {
	console.log('⚠️ WARNING: This will take 3-5 minutes to complete');
	console.log('🤖 The scraper uses respectful rate limiting (1.5-2.5s between requests)');
	console.log('📡 This helps avoid overwhelming Land-book servers\n');

	fullScrapeDemo()
		.then(result => {
			if (result.success) {
				console.log(`\n✅ SUCCESS! Generated ${result.totalDesigns} designs`);
			} else {
				console.log(`\n❌ FAILED: ${result.error}`);
			}
		})
		.catch(console.error);
}

module.exports = { fullScrapeDemo };