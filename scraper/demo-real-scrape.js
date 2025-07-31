const LandBookScraper = require('./scraper.js');

async function demonstrateRealScrape() {
	console.log('🎯 Demonstrating real scrape with JSON output generation\n');
	console.log('📍 Target: Land-book.com with health & fitness filter');
	console.log('🔢 Limit: 3 designs for demo purposes\n');

	const scraper = new LandBookScraper({
		headless: true,  // Run in background
		maxItems: 3,     // Limit to 3 items for demo
		slowMo: 50       // Faster execution
	});

	try {
		// Step 1: Initialize browser
		console.log('1️⃣ Initializing browser...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize scraper');
		}
		console.log('   ✅ Browser ready\n');

		// Step 2: Navigate to Land-book with health & fitness filter
		console.log('2️⃣ Navigating to Land-book...');
		const url = 'https://land-book.com/?industry=health-and-fitness';
		const urlInfo = {
			originalUrl: url,
			pageType: 'gallery',
			params: { industry: 'health-and-fitness' }
		};

		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) {
			throw new Error('Failed to navigate to Land-book');
		}
		console.log('   ✅ Navigation successful\n');

		// Step 3: Scrape grid page for thumbnails and links
		console.log('3️⃣ Scraping grid page...');
		const gridResults = await scraper.scrapeGridPage();
		if (!gridResults.success || gridResults.items.length === 0) {
			throw new Error('Failed to scrape grid page or no items found');
		}

		console.log(`   ✅ Found ${gridResults.items.length} designs`);
		console.log('   📋 Sample items:');
		gridResults.items.slice(0, 3).forEach((item, index) => {
			console.log(`      ${index + 1}. ${item.title || 'Untitled'}`);
			console.log(`         Thumbnail: ${item.thumbnailUrl ? 'Present' : 'Missing'}`);
			console.log(`         Detail URL: ${item.detailUrl ? 'Present' : 'Missing'}`);
		});
		console.log('');

		// Step 4: Scrape detail pages for full data
		console.log('4️⃣ Scraping detail pages...');
		console.log('   ⏱️ This may take a few minutes with rate limiting...\n');

		const detailResults = await scraper.scrapeAllDetailPages(gridResults.items);
		if (!detailResults.success) {
			throw new Error('Failed to scrape detail pages');
		}

		console.log(`   ✅ Detail scraping completed`);
		console.log(`   📊 Success: ${detailResults.successCount}/${detailResults.totalProcessed}`);
		console.log(`   ⚠️ Errors: ${detailResults.errorCount}\n`);

		// Step 5: Show sample of scraped data
		console.log('5️⃣ Sample scraped data:');
		if (detailResults.results.length > 0) {
			const sample = detailResults.results[0];
			console.log(`   📝 Website: ${sample.websiteName}`);
			console.log(`   🔗 URL: ${sample.websiteUrl}`);
			console.log(`   🏷️ Categories: [${sample.category.join(', ')}]`);
			console.log(`   🎨 Styles: [${sample.style.join(', ')}]`);
			console.log(`   🏢 Industries: [${sample.industry.join(', ')}]`);
			console.log(`   🎨 Colors: [${sample.colors.join(', ')}]`);
			console.log(`   📸 Screenshot: ${sample.screenshotUrl ? 'Present' : 'Missing'}`);
			console.log(`   🏷️ Tags: [${sample.tags.slice(0, 5).join(', ')}${sample.tags.length > 5 ? '...' : ''}]`);
		}
		console.log('');

		// Step 6: Generate JSON output (this is task 2.4!)
		console.log('6️⃣ Generating JSON output (Task 2.4)...');
		const outputPath = '../data/designs.json';
		const jsonResult = await scraper.generateJsonOutput(detailResults.results, outputPath);

		if (jsonResult.success) {
			console.log(`   ✅ JSON generation successful!`);
			console.log(`   📄 File: ${jsonResult.outputPath}`);
			console.log(`   📊 Total designs: ${jsonResult.totalDesigns}`);
			console.log(`   ⚠️ Format errors: ${jsonResult.formatErrors}`);
			console.log(`   📈 File size: ${((await require('fs').promises.readFile(outputPath, 'utf8')).length / 1024).toFixed(2)} KB`);

			if (jsonResult.statistics) {
				console.log(`\n   📊 Content Statistics:`);
				console.log(`      Designs with titles: ${jsonResult.statistics.withTitles}/${jsonResult.totalDesigns}`);
				console.log(`      Designs with colors: ${jsonResult.statistics.withColors}/${jsonResult.totalDesigns}`);
				console.log(`      Average tags per design: ${jsonResult.statistics.avgTagsPerDesign.toFixed(1)}`);
				console.log(`      Top style tags: ${jsonResult.statistics.topStyleTags.slice(0, 3).join(', ')}`);
				console.log(`      Top industries: ${jsonResult.statistics.topIndustries.slice(0, 3).join(', ')}`);
			}
		} else {
			throw new Error(`JSON generation failed: ${jsonResult.error}`);
		}

		console.log('\n🎉 Real scrape demonstration completed successfully!');
		console.log('✨ The designs.json file is now ready for the This or That application.');

		return {
			success: true,
			gridItems: gridResults.items.length,
			detailItems: detailResults.results.length,
			jsonGenerated: jsonResult.success,
			outputPath: jsonResult.outputPath
		};

	} catch (error) {
		console.error(`❌ Demo failed: ${error.message}`);
		console.error('Stack trace:', error.stack);
		return { success: false, error: error.message };
	} finally {
		await scraper.close();
		console.log('🔄 Browser closed');
	}
}

// Run demo
if (require.main === module) {
	demonstrateRealScrape()
		.then(result => {
			if (result.success) {
				console.log('\n✅ Demo completed successfully!');
				console.log(`📊 Results: ${result.detailItems} designs processed`);
				console.log(`📄 Output: ${result.outputPath}`);
			} else {
				console.log('\n❌ Demo failed!');
				console.log(`Error: ${result.error}`);
			}
		})
		.catch(console.error);
}

module.exports = { demonstrateRealScrape };