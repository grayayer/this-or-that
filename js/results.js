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

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.analyzeSelections = analyzeSelections;
	window.calculateTagFrequencies = calculateTagFrequencies;
	window.generateProfile = generateProfile;
	window.formatResults = formatResults;
	window.getFormattedResults = getFormattedResults;
}