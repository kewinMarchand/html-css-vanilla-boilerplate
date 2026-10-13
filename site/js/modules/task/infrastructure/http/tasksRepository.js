import { apiGet } from '/js/shared/api.js'

import { toTasks } from './taskTranslation.js'

export const findAllTasks = async () => toTasks(await apiGet('/api/tasks'))
