// Utility functions for the Ascend Sentiment Dashboard

/**
 * Resolve a brand image path using the Vite BASE_URL so assets load
 * correctly when the app is deployed to a subpath (e.g. GitHub Pages).
 * @param {string} path - Absolute path like '/brands/foo.png'
 * @returns {string} Path prefixed with BASE_URL
 */
export function brandImg(path) {
  const base = import.meta.env.BASE_URL || '/';
  return base + path.replace(/^\//, '');
}

/**
 * Calculate average sentiment score from an array of reviews.
 * @param {Array} reviews - Array of review objects with sentimentScore
 * @returns {number} Average sentiment score, or 0 if no reviews
 */
export function avgSentiment(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.sentimentScore || 0), 0);
  return Math.round((sum / reviews.length) * 100) / 100;
}

/**
 * Group reviews by a given key (source, brand, location, sentiment, state, etc.)
 * @param {Array} reviews - Array of review objects
 * @param {string} key - The property name to group by
 * @returns {Object} Object with keys being the unique values and values being arrays of reviews
 */
export function groupBy(reviews, key) {
  if (!reviews || !key) return {};
  return reviews.reduce((groups, review) => {
    const value = review[key] ?? 'Unknown';
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(review);
    return groups;
  }, {});
}

/**
 * Get sentiment distribution counts.
 * @param {Array} reviews - Array of review objects
 * @returns {Object} { positive: number, neutral: number, negative: number }
 */
export function sentimentDistribution(reviews) {
  if (!reviews) return { positive: 0, neutral: 0, negative: 0 };
  return reviews.reduce(
    (dist, r) => {
      if (r.sentiment === 'positive') dist.positive++;
      else if (r.sentiment === 'neutral') dist.neutral++;
      else if (r.sentiment === 'negative') dist.negative++;
      return dist;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
}

/**
 * Get monthly trend data for charts.
 * Returns an array of objects sorted chronologically from Mar 2025 to Feb 2026.
 * @param {Array} reviews - Array of review objects
 * @returns {Array} [{month: 'Mar 2025', positive: n, neutral: n, negative: n, avg: 0.x, total: n}, ...]
 */
export function monthlyTrend(reviews) {
  if (!reviews || reviews.length === 0) return [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Define the 12-month range: Mar 2025 - Feb 2026
  const months = [];
  for (let m = 2; m <= 13; m++) {
    const year = m > 11 ? 2026 : 2025;
    const monthIndex = m % 12;
    months.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: `${monthNames[monthIndex]} ${year}`,
      year,
      monthIndex,
    });
  }

  // Bucket reviews into months
  const buckets = {};
  months.forEach(m => {
    buckets[m.key] = { positive: 0, neutral: 0, negative: 0, scores: [], total: 0 };
  });

  reviews.forEach(r => {
    const dateKey = r.date.substring(0, 7); // 'YYYY-MM'
    if (buckets[dateKey]) {
      buckets[dateKey][r.sentiment]++;
      buckets[dateKey].scores.push(r.sentimentScore);
      buckets[dateKey].total++;
    }
  });

  return months.map(m => {
    const b = buckets[m.key];
    const avg = b.scores.length > 0
      ? Math.round((b.scores.reduce((a, s) => a + s, 0) / b.scores.length) * 100) / 100
      : 0;
    return {
      month: m.label,
      positive: b.positive,
      neutral: b.neutral,
      negative: b.negative,
      avg,
      total: b.total,
    };
  });
}

/**
 * Filter reviews by multiple criteria.
 * @param {Array} reviews - Array of review objects
 * @param {Object} filters - Filter criteria
 * @param {Array} [filters.dateRange] - [startDate, endDate] as ISO strings
 * @param {Array} [filters.sources] - Array of source strings to include
 * @param {Array} [filters.brands] - Array of brand strings to include
 * @param {Array} [filters.locations] - Array of location strings to include
 * @param {Array} [filters.sentiments] - Array of sentiment strings to include
 * @param {Array} [filters.categories] - Array of category strings (review must have at least one)
 * @param {string} [filters.search] - Free text search in review text
 * @param {Array} [filters.states] - Array of state abbreviations to include
 * @returns {Array} Filtered array of reviews
 */
export function filterReviews(reviews, filters = {}) {
  if (!reviews) return [];
  if (!filters || Object.keys(filters).length === 0) return reviews;

  return reviews.filter(r => {
    // Date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      if (start && r.date < start) return false;
      if (end && r.date > end) return false;
    }

    // Source filter
    if (filters.sources && filters.sources.length > 0) {
      if (!filters.sources.includes(r.source)) return false;
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      if (r.brand === null) return false;
      if (!filters.brands.includes(r.brand)) return false;
    }

    // Location filter
    if (filters.locations && filters.locations.length > 0) {
      if (!filters.locations.includes(r.location)) return false;
    }

    // Sentiment filter
    if (filters.sentiments && filters.sentiments.length > 0) {
      if (!filters.sentiments.includes(r.sentiment)) return false;
    }

    // Category filter (review must match at least one selected category)
    if (filters.categories && filters.categories.length > 0) {
      const hasMatch = r.categories.some(c => filters.categories.includes(c));
      if (!hasMatch) return false;
    }

    // State filter
    if (filters.states && filters.states.length > 0) {
      if (!filters.states.includes(r.state)) return false;
    }

    // Text search
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      const textMatch = r.text.toLowerCase().includes(searchLower);
      const titleMatch = r.title && r.title.toLowerCase().includes(searchLower);
      const authorMatch = r.author.toLowerCase().includes(searchLower);
      if (!textMatch && !titleMatch && !authorMatch) return false;
    }

    return true;
  });
}

/**
 * Get top words/phrases from review texts for word cloud display.
 * Filters out common English stop words and short words.
 * @param {Array} reviews - Array of review objects
 * @param {number} [limit=40] - Maximum number of words to return
 * @returns {Array} [{text: 'word', value: count}, ...] sorted by count descending
 */
export function getTopWords(reviews, limit = 40) {
  if (!reviews || reviews.length === 0) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'its', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'dare', 'ought', 'used', 'not', 'no', 'nor', 'so', 'too', 'very',
    'just', 'about', 'above', 'after', 'again', 'all', 'also', 'am',
    'any', 'are', 'as', 'because', 'before', 'between', 'both', 'each',
    'few', 'further', 'get', 'got', 'he', 'her', 'here', 'him', 'his',
    'how', 'i', 'if', 'into', 'me', 'more', 'most', 'my', 'myself',
    'new', 'now', 'only', 'other', 'our', 'out', 'own', 'same', 'she',
    'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there',
    'these', 'they', 'this', 'those', 'through', 'under', 'until', 'up',
    'we', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
    'why', 'you', 'your', 'yours', 'yourself', 'went', 'had', 'like',
    'been', 'over', 'much', 'even', 'make', 'made', 'still', 'way',
    'back', 'down', 'off', 'take', 'told', 'said', 'really', 'going',
    'came', 'come', 'thing', 'things', 'sure', 'think', 'know', 'look',
    'time', 'well', 'right', 'day', 'don', 'didn', 'doesn', 'won',
    'wasn', 'wouldn', 'couldn', 'isn', 'aren', 'haven', 'hasn', 't',
    's', 've', 'll', 're', 'd', 'm', 'let', 'one', 'two', 'first',
    'last', 'long', 'great', 'good', 'bad', 'little', 'big',
  ]);

  const wordCount = {};

  reviews.forEach(r => {
    const words = r.text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  return Object.entries(wordCount)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Get sentiment color for charts and badges.
 * @param {string} sentiment - 'positive' | 'neutral' | 'negative'
 * @returns {string} Hex color code
 */
export function sentimentColor(sentiment) {
  if (typeof sentiment === 'number') {
    sentiment = sentiment >= 0.2 ? 'positive' : sentiment <= -0.2 ? 'negative' : 'neutral';
  }
  return { positive: '#00E08E', neutral: '#f59e0b', negative: '#E87068' }[sentiment] || '#6b7280';
}

/**
 * Get sentiment label with emoji.
 * @param {string} sentiment - 'positive' | 'neutral' | 'negative'
 * @returns {string} Label with emoji prefix
 */
export function sentimentLabel(sentiment) {
  if (typeof sentiment === 'number') {
    sentiment = sentiment >= 0.2 ? 'positive' : sentiment <= -0.2 ? 'negative' : 'neutral';
  }
  return {
    positive: '\u{1F60A} Positive',
    neutral: '\u{1F610} Neutral',
    negative: '\u{1F61E} Negative',
  }[sentiment] || 'Unknown';
}

/**
 * Calculate an NPS-like score from reviews.
 * Promoters = positive reviews (score > 0.3)
 * Detractors = negative reviews (score < -0.3)
 * Passives = everything in between
 * NPS = ((promoters - detractors) / total) * 100
 * @param {Array} reviews - Array of review objects
 * @returns {number} NPS score from -100 to 100
 */
export function calculateNPS(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  let promoters = 0;
  let detractors = 0;

  reviews.forEach(r => {
    if (r.sentimentScore > 0.3) promoters++;
    else if (r.sentimentScore < -0.3) detractors++;
  });

  const nps = Math.round(((promoters - detractors) / reviews.length) * 100);
  return Math.max(-100, Math.min(100, nps));
}

/**
 * Get category-level sentiment breakdown.
 * @param {Array} reviews - Array of review objects
 * @returns {Array} [{category, positive, neutral, negative, avg, total}, ...] sorted by total descending
 */
export function categorySentiment(reviews) {
  if (!reviews || reviews.length === 0) return [];

  const catData = {};

  reviews.forEach(r => {
    r.categories.forEach(cat => {
      if (!catData[cat]) {
        catData[cat] = { positive: 0, neutral: 0, negative: 0, scores: [], total: 0 };
      }
      catData[cat][r.sentiment]++;
      catData[cat].scores.push(r.sentimentScore);
      catData[cat].total++;
    });
  });

  return Object.entries(catData)
    .map(([category, data]) => ({
      category,
      positive: data.positive,
      neutral: data.neutral,
      negative: data.negative,
      avg: data.scores.length > 0
        ? Math.round((data.scores.reduce((a, s) => a + s, 0) / data.scores.length) * 100) / 100
        : 0,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);
}
