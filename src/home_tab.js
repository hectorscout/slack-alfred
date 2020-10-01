import { getProjects } from './models'
import availableProjects from './messages/available_projects'

const openHomeTab = app => async payload => {
  const { event, context } = payload
  const projects = await getProjects()
  const projectsBlocks = availableProjects('', projects)

  app.client.views.publish({
    token: context.botToken,
    user_id: event.user,
    view: {
      type: 'home',
      blocks: projectsBlocks,
    },
  })
}

export default openHomeTab
