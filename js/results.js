/**
 * Results Analysis Engine
 * Processes user selections to generate design preference profiles
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

/**
 * Main function to analyze user selections and generate preference profile
 * Implements requirement 4.1: Generate results summary after at least 20 choices
 * @param {Array} selections - Array of selection records from appState.selections
 * @param {Array} designs - Array of all design objects for reference
 * @returns {Object} - Complete analysis results with preference profile
 */
function analyzeSelections(selections, designs) {
	try {
		if (!selections || !Array.isArray(selections) || selections.length === 0) {
			throw new Error('No selections provided for analysis');
		}

		if (!designs || !Array.isArray(designs) || designs.length === 0) {
			throw new Error('No designs provided for analysis');
		}

		console.log(`🔍 Analyzing ${selections.length} selections...`);

		// Calculate tag frequencies across all categories
		const tagFrequencies = calculateTagFrequencies(selections, designs);

		// Generate ranked preference profile
		const profile = generateProfile(tagFrequencies, selections);

		// Create complete results object
		const results = {
			metadata: {
				totalSelections: selections.length,
				completedAt: new Date().toISOString(),
				analysisVersion: '1.0'
			},
			tagFrequencies,
			profile,
			selections: selections.map(s => ({
				...s,
				// Remove full tag objects to reduce size, keep only IDs
				selectedTags: undefined,
				rejectedTags: undefined
			}))
		};

		console.log('✅ Selection analysis completed');
		return results;

	} catch (error) {
		console.error('❌ Failed to analyze selections:', error.message);
		throw error;
	}
}

/**
 * Calculates tag frequencies across all categories from user selections
 * Implements requirement 4.2: Analyze tags from all selected images
 * @param {Array} selections - Array of selection records
 * @param {Array} designs - Array of all design objects for reference
 * @returns {Object} - Tag frequencies organized by category
 */
function calculateTagFrequencies(selections, designs) {
	try {
		// Create design lookup for efficient access
		const designLookup = new Map();
		designs.forEach(design => {
			designLookup.set(design.id, design);
		});

		// Initialize frequency counters for all categories
		const frequencies = {
			style: new Map(),
			industry: new Map(),
			typography: new Map(),
			type: new Map(),
			category: new Map(),
			platform: new Map(),
			colors: new Map()
		};

		// Process each selection
		selections.forEach(selection => {
			const selectedDesign = designLookup.get(selection.selectedId);

			if (!selectedDesign || !selectedDesign.tags) {
				console.warn(`⚠️ Design ${selection.selectedId} not found or has no tags`);
				return;
			}

			// Count tags from selected design across all categories
			Object.keys(frequencies).forEach(category => {
				const tags = selectedDesign.tags[category];
				if (Array.isArray(tags)) {
					tags.forEach(tag => {
						const currentCount = frequencies[category].get(tag) || 0;
						frequencies[category].set(tag, currentCount + 1);
					});
				}
			});
		});

		// Convert Maps to sorted arrays with percentages
		const result = {};
		Object.keys(frequencies).forEach(category => {
			const categoryMap = frequencies[category];
			const totalSelections = selections.length;

			// Convert to array and sort by frequency (descending)
			const sortedTags = Array.from(categoryMap.entries())
				.map(([tag, count]) => ({
					tag,
					frequency: count,
					percentage: Math.round((count / totalSelections) * 100)
				}))
				.sort((a, b) => b.frequency - a.frequency);

			result[category] = sortedTags;
		});

		console.log('📊 Tag frequency analysis completed');
		return result;

	} catch (error) {
		console.error('❌ Failed to calculate tag frequencies:', error.message);
		throw error;
	}
}

/**
 * Generates a ranked preference profile based on tag frequencies
 * Implements requirements 4.3, 4.4: Show ranked lists and most frequently chosen tags first
 * @param {Object} tagFrequencies - Tag frequencies from calculateTagFrequencies
 * @param {Array} selections - Original selections for additional context
 * @returns {Object} - Structured preference profile with rankings and recommendations
 */
function generateProfile(tagFrequencies, selections) {
	try {
		// Generate category-specific preferences (requirement 4.3)
		const preferences = {};

		// Process each category and create ranked lists (requirement 4.4)
		Object.keys(tagFrequencies).forEach(category => {
			const tags = tagFrequencies[category];

			// Only include tags that appear in at least 10% of selections for cleaner results
			const minThreshold = Math.max(1, Math.ceil(selections.length * 0.1));
			const significantTags = tags.filter(item => item.frequency >= minThreshold);

			preferences[category] = {
				top: significantTags.slice(0, 5), // Top 5 most frequent
				all: significantTags,
				totalUnique: tags.length
			};
		});

		// Generate top-level recommendations based on strongest preferences
		const topRecommendations = generateTopRecommendations(preferences, selections.length);

		// Calculate preference strength scores
		const strengthScores = calculatePreferenceStrength(preferences, selections.length);

		// Generate insights about user's design preferences
		const insights = generateDesignInsights(preferences, selections);

		const profile = {
			preferences,
			topRecommendations,
			strengthScores,
			insights,
			summary: generateProfileSummary(preferences, selections.length)
		};

		console.log('🎯 Preference profile generated');
		return profile;

	} catch (error) {
		console.error('❌ Failed to generate profile:', error.message);
		throw error;
	}
}

/**
 * Generates top-level design recommendations based on strongest preferences
 * @param {Object} preferences - Categorized preferences
 * @param {number} totalSelections - Total number of selections made
 * @returns {Array} - Array of recommendation strings
 */
function generateTopRecommendations(preferences, totalSelections) {
	const recommendations = [];

	// Style recommendations
	if (preferences.style.top.length > 0) {
		const topStyle = preferences.style.top[0];
		if (topStyle.percentage >= 30) {
			recommendations.push(`Strongly prefers ${topStyle.tag.toLowerCase()} design aesthetics`);
		}
	}

	// Industry focus
	if (preferences.industry.top.length > 0) {
		const topIndustry = preferences.industry.top[0];
		if (topIndustry.percentage >= 25) {
			recommendations.push(`Shows preference for ${topIndustry.tag.toLowerCase()} industry designs`);
		}
	}

	// Typography preferences
	if (preferences.typography.top.length > 0) {
		const topTypography = preferences.typography.top[0];
		recommendations.push(`Favors ${topTypography.tag.toLowerCase()} typography`);
	}

	// Color analysis
	if (preferences.colors.top.length > 0) {
		const topColors = preferences.colors.top.slice(0, 3);
		const colorNames = topColors.map(c => c.tag);
		recommendations.push(`Gravitates toward color palette including ${colorNames.join(', ')}`);
	}

	// Platform/technology preferences
	if (preferences.platform.top.length > 0) {
		const topPlatform = preferences.platform.top[0];
		if (topPlatform.percentage >= 20) {
			recommendations.push(`Shows affinity for ${topPlatform.tag} implementations`);
		}
	}

	// Fallback recommendations if no strong patterns
	if (recommendations.length === 0) {
		recommendations.push('Appreciates diverse design approaches');
		recommendations.push('Values variety in visual aesthetics');
	}

	return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

/**
 * Calculates preference strength scores for each category
 * @param {Object} preferences - Categorized preferences
 * @param {number} totalSelections - Total number of selections
 * @returns {Object} - Strength scores by category
 */
function calculatePreferenceStrength(preferences, totalSelections) {
	const scores = {};

	Object.keys(preferences).forEach(category => {
		const categoryPrefs = preferences[category];

		if (categoryPrefs.top.length === 0) {
			scores[category] = { strength: 'weak', score: 0, description: 'No clear preference' };
			return;
		}

		const topItem = categoryPrefs.top[0];
		const percentage = topItem.percentage;

		let strength, description;
		if (percentage >= 50) {
			strength = 'very strong';
			description = `Very strong preference for ${topItem.tag}`;
		} else if (percentage >= 35) {
			strength = 'strong';
			description = `Strong preference for ${topItem.tag}`;
		} else if (percentage >= 20) {
			strength = 'moderate';
			description = `Moderate preference for ${topItem.tag}`;
		} else {
			strength = 'weak';
			description = `Slight preference for ${topItem.tag}`;
		}

		scores[category] = {
			strength,
			score: percentage,
			description,
			topChoice: topItem.tag
		};
	});

	return scores;
}

/**
 * Generates insights about the user's design preferences
 * @param {Object} preferences - Categorized preferences
 * @param {Array} selections - Original selections
 * @returns {Object} - Design insights and patterns
 */
function generateDesignInsights(preferences, selections) {
	const insights = {
		patterns: [],
		diversity: {},
		consistency: {},
		trends: []
	};

	// Analyze diversity of choices
	Object.keys(preferences).forEach(category => {
		const categoryPrefs = preferences[category];
		const totalUnique = categoryPrefs.totalUnique;
		const topPercentage = categoryPrefs.top[0]?.percentage || 0;

		insights.diversity[category] = {
			uniqueChoices: totalUnique,
			dominance: topPercentage,
			variety: totalUnique > 5 ? 'high' : totalUnique > 2 ? 'medium' : 'low'
		};
	});

	// Identify consistency patterns
	const consistentCategories = Object.keys(preferences).filter(category => {
		const topPercentage = preferences[category].top[0]?.percentage || 0;
		return topPercentage >= 40;
	});

	insights.consistency = {
		strongCategories: consistentCategories,
		overallConsistency: consistentCategories.length >= 3 ? 'high' :
			consistentCategories.length >= 1 ? 'medium' : 'low'
	};

	// Generate pattern insights
	if (consistentCategories.length > 0) {
		insights.patterns.push(`Shows consistent preferences in ${consistentCategories.join(', ')}`);
	}

	if (insights.diversity.style?.variety === 'high') {
		insights.patterns.push('Appreciates diverse visual styles');
	}

	if (insights.diversity.colors?.uniqueChoices > 10) {
		insights.patterns.push('Drawn to varied color palettes');
	}

	return insights;
}

/**
 * Generates a concise summary of the user's design profile
 * @param {Object} preferences - Categorized preferences
 * @param {number} totalSelections - Total selections made
 * @returns {string} - Profile summary text
 */
function generateProfileSummary(preferences, totalSelections) {
	const topPreferences = [];

	// Get the strongest preference from each category
	Object.keys(preferences).forEach(category => {
		const top = preferences[category].top[0];
		if (top && top.percentage >= 25) {
			topPreferences.push(`${category}: ${top.tag} (${top.percentage}%)`);
		}
	});

	if (topPreferences.length === 0) {
		return `Based on ${totalSelections} choices, you show appreciation for diverse design approaches without strong categorical preferences.`;
	}

	return `Based on ${totalSelections} choices, your strongest preferences are: ${topPreferences.join(', ')}.`;
}

/**
 * Formats results for display-ready presentation
 * Implements requirement 4.5: Provide clear design direction profile
 * @param {Object} analysisResults - Results from analyzeSelections
 * @returns {Object} - Display-ready formatted results
 */
function formatResults(analysisResults) {
	try {
		if (!analysisResults || !analysisResults.profile) {
			throw new Error('Invalid analysis results provided');
		}

		const { metadata, profile, tagFrequencies } = analysisResults;

		// Format for display with proper structure and styling classes
		const formatted = {
			header: {
				title: 'Your Design Preferences',
				subtitle: `Based on ${metadata.totalSelections} choices`,
				completedAt: new Date(metadata.completedAt).toLocaleDateString(),
				summary: profile.summary
			},

			// Main preference categories for display
			categories: Object.keys(profile.preferences).map(category => ({
				name: category,
				displayName: formatCategoryName(category),
				icon: getCategoryIcon(category),
				strength: profile.strengthScores[category],
				topItems: profile.preferences[category].top.map(item => ({
					...item,
					displayTag: formatTagForDisplay(item.tag),
					barWidth: `${Math.min(100, item.percentage * 2)}%` // Scale for visual bars
				})),
				totalUnique: profile.preferences[category].totalUnique
			})),

			// Top recommendations section
			recommendations: {
				title: 'Design Direction Recommendations',
				items: profile.topRecommendations
			},

			// Insights section
			insights: {
				title: 'Your Design Profile Insights',
				patterns: profile.insights.patterns,
				consistency: profile.insights.consistency,
				diversity: profile.insights.diversity
			},

			// Summary statistics
			statistics: {
				totalChoices: metadata.totalSelections,
				completedAt: metadata.completedAt,
				strongestCategory: findStrongestCategory(profile.strengthScores),
				diversityScore: calculateOverallDiversity(profile.insights.diversity)
			}
		};

		console.log('✅ Results formatted for display');
		return formatted;

	} catch (error) {
		console.error('❌ Failed to format results:', error.message);
		throw error;
	}
}

/**
 * Formats category names for display
 * @param {string} category - Raw category name
 * @returns {string} - Formatted display name
 */
function formatCategoryName(category) {
	const categoryNames = {
		style: 'Visual Style',
		industry: 'Industry Focus',
		typography: 'Typography',
		type: 'Project Type',
		category: 'Site Category',
		platform: 'Technology Platform',
		colors: 'Color Preferences'
	};

	return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Gets appropriate icon for each category
 * @param {string} category - Category name
 * @returns {string} - Icon class or emoji
 */
function getCategoryIcon(category) {
	const icons = {
		style: '🎨',
		industry: '🏢',
		typography: '📝',
		type: '🔧',
		category: '📂',
		platform: '💻',
		colors: '🌈'
	};

	return icons[category] || '📊';
}

/**
 * Formats individual tags for better display
 * @param {string} tag - Raw tag name
 * @returns {string} - Formatted tag for display
 */
function formatTagForDisplay(tag) {
	// Handle color hex codes
	if (tag.startsWith('#')) {
		return tag.toUpperCase();
	}

	// Handle multi-word tags
	return tag.split(/[\s&]+/).map(word =>
		word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
	).join(' ');
}

/**
 * Finds the category with the strongest preference
 * @param {Object} strengthScores - Strength scores by category
 * @returns {Object} - Strongest category info
 */
function findStrongestCategory(strengthScores) {
	let strongest = { category: null, score: 0, strength: 'weak' };

	Object.keys(strengthScores).forEach(category => {
		const categoryScore = strengthScores[category];
		if (categoryScore.score > strongest.score) {
			strongest = {
				category,
				score: categoryScore.score,
				strength: categoryScore.strength,
				topChoice: categoryScore.topChoice
			};
		}
	});

	return strongest;
}

/**
 * Calculates overall diversity score across all categories
 * @param {Object} diversityData - Diversity data by category
 * @returns {string} - Overall diversity level
 */
function calculateOverallDiversity(diversityData) {
	const varieties = Object.values(diversityData).map(d => d.variety);
	const highCount = varieties.filter(v => v === 'high').length;
	const mediumCount = varieties.filter(v => v === 'medium').length;

	if (highCount >= 3) return 'high';
	if (highCount >= 1 || mediumCount >= 3) return 'medium';
	return 'low';
}

/**
 * Utility function to get analysis results for external use
 * @param {Array} selections - User selections from app state
 * @param {Array} designs - All design objects
 * @returns {Object} - Complete formatted results ready for display
 */
function getFormattedResults(selections, designs) {
	try {
		const analysisResults = analyzeSelections(selections, designs);
		return formatResults(analysisResults);
	} catch (error) {
		console.error('❌ Failed to get formatted results:', error.message);
		throw error;
	}
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzeSelections,
		calculateTagFrequencies,
		generateProfile,
		formatResults,
		getFormattedResults
	};
}

/**
 * Generates HTML for the top favorites section (up to 10)
 * @returns {string} - HTML string for favorites section
 */
function generateFavoritesHTML() {
	try {
		// Check if FavoritesManager is available
		if (typeof FavoritesManager === 'undefined') {
			return '';
		}

		const topFavorites = FavoritesManager.getTopFavorites();

		if (topFavorites.length === 0) {
			return `
				<div class="favorites-section">
					<h3>🏆 Your Top Favorite Designs</h3>
					<p class="favorites-empty">No favorites yet! Heart designs during selection or select the same design multiple times to build your favorites list.</p>
				</div>
			`;
		}

		const favoritesHTML = `
			<div class="favorites-section">
				<h3>🏆 Your Top ${topFavorites.length} Favorite Design${topFavorites.length === 1 ? '' : 's'}</h3>
				<p class="favorites-description">Based on your selections and bookmarks, these are the designs you liked most:</p>
				<div class="favorites-list">
					${topFavorites.map((favorite, index) => `
						<div class="favorite-item">
							<div class="favorite-rank">${index + 1}</div>
							<div class="favorite-content">
								<div class="favorite-image">
									<img src="${favorite.image}" alt="${favorite.title}" loading="lazy">
								</div>
								<div class="favorite-details">
									<h4 class="favorite-title">${favorite.title || 'Untitled Design'}</h4>
									<a href="${favorite.url}" target="_blank" rel="noopener" class="favorite-url">${favorite.url}</a>
									<div class="favorite-stats">
										<span class="favorite-selections">Selected ${favorite.selectionCount} time${favorite.selectionCount !== 1 ? 's' : ''}</span>
										${favorite.isHearted ? '<span class="favorite-heart">❤️ Bookmarked</span>' : ''}
									</div>
								</div>
							</div>
						</div>
					`).join('')}
				</div>
			</div>
		`;

		return favoritesHTML;

	} catch (error) {
		console.error('❌ Failed to generate favorites HTML:', error);
		return `
			<div class="favorites-section">
				<h3>🏆 Your Top Favorite Designs</h3>
				<p class="favorites-error">Unable to load favorites data.</p>
			</div>
		`;
	}
}

/**
 * Generates HTML content for displaying results in the UI
 * Implements requirements 4.3, 4.4, 4.5: Display ranked tag lists and design profile
 * @param {Object} formattedResults - Results from formatResults function
 * @returns {string} - HTML string ready for insertion into DOM
 */
function generateResultsHTML(formattedResults) {
	try {
		if (!formattedResults || !formattedResults.categories) {
			throw new Error('Invalid formatted results provided');
		}

		const { header, categories, recommendations, insights, statistics } = formattedResults;

		// Generate summary section
		const summaryHTML = `
			<div class="results-summary">
				<h3>Your Design Profile Summary</h3>
				<p>${header.summary}</p>
				<p><strong>Analysis completed:</strong> ${header.completedAt} • <strong>Total choices:</strong> ${statistics.totalChoices}</p>
			</div>
		`;

		// Generate recommendations section
		const recommendationsHTML = `
			<div class="recommendations-section">
				<h3>${recommendations.title}</h3>
				<ul class="recommendation-list">
					${recommendations.items.map(item => `
						<li class="recommendation-item">${item}</li>
					`).join('')}
				</ul>
			</div>
		`;

		// Generate preference categories
		const categoriesHTML = categories.map(category => {
			if (category.topItems.length === 0) {
				return ''; // Skip categories with no preferences
			}

			const strengthClass = `strength-${category.strength.strength.replace(' ', '-')}`;

			return `
				<div class="preference-category">
					<div class="category-header">
						<span class="category-icon">${category.icon}</span>
						<h3 class="category-title">${category.displayName}</h3>
						<span class="category-strength ${strengthClass}">
							${category.strength.strength} (${category.strength.score}%)
						</span>
					</div>
					<div class="preference-items">
						${category.topItems.map(item => {
				// Special handling for colors
				if (category.name === 'colors' && item.tag.startsWith('#')) {
					return `
									<div class="preference-item">
										<div class="color-preference-item">
											<div class="color-swatch" style="background-color: ${item.tag}"></div>
											<span class="preference-tag">${item.displayTag}</span>
										</div>
										<div class="preference-stats">
											<span class="preference-percentage">${item.percentage}%</span>
											<div class="preference-bar">
												<div class="preference-bar-fill" style="width: ${item.barWidth}"></div>
											</div>
										</div>
									</div>
								`;
				} else {
					return `
									<div class="preference-item">
										<span class="preference-tag">${item.displayTag}</span>
										<div class="preference-stats">
											<span class="preference-percentage">${item.percentage}%</span>
											<div class="preference-bar">
												<div class="preference-bar-fill" style="width: ${item.barWidth}"></div>
											</div>
										</div>
									</div>
								`;
				}
			}).join('')}
					</div>
				</div>
			`;
		}).filter(html => html !== '').join('');

		// Generate favorites section
		const favoritesHTML = generateFavoritesHTML();

		// Generate insights section
		const insightsHTML = `
			<div class="insights-section">
				<h3>${insights.title}</h3>
				<div class="insight-grid">
					<div class="insight-card">
						<h4>Consistency Level</h4>
						<p>${insights.consistency.overallConsistency.charAt(0).toUpperCase() + insights.consistency.overallConsistency.slice(1)} consistency across preferences</p>
					</div>
					<div class="insight-card">
						<h4>Diversity Score</h4>
						<p>${statistics.diversityScore.charAt(0).toUpperCase() + statistics.diversityScore.slice(1)} variety in design choices</p>
					</div>
					<div class="insight-card">
						<h4>Strongest Preference</h4>
						<p>${statistics.strongestCategory.topChoice} in ${formatCategoryName(statistics.strongestCategory.category)}</p>
					</div>
				</div>
				${insights.patterns.length > 0 ? `
					<div style="margin-top: 20px;">
						<h4>Key Patterns</h4>
						<ul style="margin: 8px 0 0 20px; color: #666666;">
							${insights.patterns.map(pattern => `<li>${pattern}</li>`).join('')}
						</ul>
					</div>
				` : ''}
			</div>
		`;

		// Combine all sections
		const fullHTML = summaryHTML + recommendationsHTML + favoritesHTML + categoriesHTML + insightsHTML;

		console.log('✅ Results HTML generated successfully');
		return fullHTML;

	} catch (error) {
		console.error('❌ Failed to generate results HTML:', error.message);
		return `
			<div class="error-container">
				<h3>Unable to Display Results</h3>
				<p>There was an error generating your design preference profile. Please try again.</p>
			</div>
		`;
	}
}

/**
 * Displays the results in the UI by replacing placeholder content
 * Implements requirement 4.5: Replace placeholder results section with actual analysis display
 * @param {Array} selections - User selections from app state
 * @param {Array} designs - All design objects
 */
function displayResults(selections, designs) {
	try {
		console.log('🎨 Displaying results in UI...');

		// Get formatted results
		const formattedResults = getFormattedResults(selections, designs);

		// Generate HTML content
		const resultsHTML = generateResultsHTML(formattedResults);

		// Find the results section and preference categories container
		const resultsSection = document.getElementById('results-section');
		const preferenceCategoriesContainer = document.getElementById('preference-categories');

		if (!resultsSection || !preferenceCategoriesContainer) {
			throw new Error('Results section elements not found in DOM');
		}

		// Update the header with actual data
		const resultsHeader = resultsSection.querySelector('.results-header');
		if (resultsHeader) {
			const description = resultsHeader.querySelector('.results-description');
			if (description) {
				description.textContent = `Based on your ${formattedResults.statistics.totalChoices} choices, here's your design preference profile`;
			}
		}

		// Insert the generated HTML
		preferenceCategoriesContainer.innerHTML = resultsHTML;

		// Show the results section
		resultsSection.style.display = 'block';

		// Animate the preference bars
		setTimeout(() => {
			const bars = resultsSection.querySelectorAll('.preference-bar-fill');
			bars.forEach(bar => {
				const width = bar.style.width;
				bar.style.width = '0%';
				setTimeout(() => {
					bar.style.width = width;
				}, 100);
			});
		}, 200);

		console.log('✅ Results displayed successfully');

	} catch (error) {
		console.error('❌ Failed to display results:', error.message);

		// Show error in results section
		const preferenceCategoriesContainer = document.getElementById('preference-categories');
		if (preferenceCategoriesContainer) {
			preferenceCategoriesContainer.innerHTML = `
				<div class="error-container">
					<h3>Unable to Display Results</h3>
					<p>There was an error generating your design preference profile: ${error.message}</p>
					<p>Please try refreshing the page and completing the choices again.</p>
				</div>
			`;
		}
	}
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.analyzeSelections = analyzeSelections;
	window.calculateTagFrequencies = calculateTagFrequencies;
	window.generateProfile = generateProfile;
	window.formatResults = formatResults;
	window.getFormattedResults = getFormattedResults;
	window.generateResultsHTML = generateResultsHTML;
	window.displayResults = displayResults;
}