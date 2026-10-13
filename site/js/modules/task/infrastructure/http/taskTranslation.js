import { ApiContractError, field } from '/js/shared/api.js'

export const toTask = (dto) => ({
  id: String(field(dto, 'id', 'number')),
  title: field(dto, 'title', 'string'),
  done: field(dto, 'done', 'boolean'),
})

export const toTasks = (dto) => {
  if (!Array.isArray(dto)) throw new ApiContractError('tâches')
  return dto.map(toTask)
}
