const LandBookScraper = require('./scraper.js');

async function finalFullScrape() {
	console.log('🎯 Final full scrape with fixed URL extraction\n');
	console.log('📍 Target: https://land-book.com/?industry=health-and-fitness');
	console.log('🔢 Limit: 20 designs with rich taxonomy data');
	console.log('⏱️ Expected time: 3-5 minutes\n');

	const scraper = new LandBookScraper({
		headless: true,
		maxItems: 20
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

		console.log('1️⃣ Grid scraping with correct URLs...');
		const gridResults = await scraper.scrapeGridPage();
		console.log(`   ✅ Found ${gridResults.items.length} designs with specific website URLs\n`);

		console.log('2️⃣ Detail scraping (this will take a few minutes)...');
		const detailResults = await scraper.scrapeAllDetailPages(gridResults.items);
		console.log(`\n   ✅ Success: ${detailResults.successCount}/${detailResults.totalProcessed}\n`);

		console.log('3️⃣ Generating final designs.json...');
		const jsonResult = await scraper.generateJsonOutput(detailResults.results, '../data/designs.json');

		if (jsonResult.success) {
			console.log(`   ✅ Final JSON generated!`);
			console.log(`   📄 File: ${jsonResult.outputPath}`);
			console.log(`   📊 Total designs: ${jsonResult.totalDesigns}`);

			if (jsonResult.statistics) {
				console.log(`\n   🎉 FINAL RESULTS:`);
				console.log(`      ✅ Designs with titles: ${jsonResult.statistics.withTitles}/${jsonResult.totalDesigns}`);
				console.log(`      ✅ Designs with colors: ${jsonResult.statistics.withColors}/${jsonResult.totalDesigns}`);
				console.log(`      ✅ Average tags per design: ${jsonResult.statistics.avgTagsPerDesign.toFixed(1)}`);
				console.log(`      🎨 Top style tags: ${jsonResult.statistics.topStyleTags.slice(0, 5).join(', ')}`);
				console.log(`      🏢 Top industries: ${jsonResult.statistics.topIndustries.slice(0, 5).join(', ')}`);
			}

			console.log(`\n✨ SUCCESS! Generated high-quality designs.json for This or That app`);
			console.log(`📈 Data quality improved dramatically with specific website URLs`);
		}

		return { success: true, designs: jsonResult.totalDesigns };

	} catch (error) {
		console.error(`❌ Final scrape failed: ${error.message}`);
		return { success: false, error: error.message };
	} finally {
		await scraper.close();
	}
}

finalFullScrape()
	.then(result => {
		if (result.success) {
			console.log(`\n🎉 COMPLETE! Generated ${result.designs} designs with rich taxonomy data`);
		} else {
			console.log(`\n❌ FAILED: ${result.error}`);
		}
	})
	.catch(console.error);