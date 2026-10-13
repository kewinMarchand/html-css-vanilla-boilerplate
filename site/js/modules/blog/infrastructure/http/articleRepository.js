import { apiGet } from '/js/shared/api.js'

import { toArticles } from './articleTranslation.js'

export const findLatestArticles = async () => toArticles(await apiGet('/api/articles'))
