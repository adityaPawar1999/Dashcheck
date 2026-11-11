import { useEffect, useState } from 'react'

function createdTime(createdAt) {
  if (typeof createdAt === 'number') return createdAt
  if (createdAt instanceof Date) return createdAt.getTime()
  return createdAt?.toMillis?.() ?? NaN
}

export default function TaskProgress({ projects, projectColors, onOpenProjectTasks, onCreateProject }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const tasks = projects.flatMap(project => project.items ?? [])
  const completed = tasks.filter(task => task.done).length
  const pending = tasks.length - completed
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const completedByProject = projects.map(project => ({
    id: project.id,
    name: project.name,
    hue: projectColors.get(project.id),
    count: (project.items ?? []).filter(task => task.done).length,
  })).filter(project => project.count > 0)
  const projectPending = projects.map(project => ({
    id: project.id,
    name: project.name,
    hue: projectColors.get(project.id),
    count: (project.items ?? []).filter(task => !task.done).length,
    hasOverdue: (project.items ?? []).some(task => {
      const created = createdTime(task.createdAt)
      return !task.done && Number.isFinite(created) && now - created > 86400000
    }),
  }))
  const pendingTotal = projectPending.reduce((total, project) => total + project.count, 0)

  return <section className="overall-progress" aria-label="Workspace progress and pending tasks by project">
    <div className="overall-progress-top">
      <div className="overall-progress-heading">
        <span className="overall-progress-icon" aria-hidden="true">&#10003;</span>
        <div>
          <strong>Workspace progress</strong>
          <span>{completed} of {tasks.length} tasks completed</span>
        </div>
      </div>
      <div className="overall-progress-actions">
        <div className="overall-progress-score"><b>{progress}%</b><span>complete</span></div>
        <button type="button" className="primary-button" onClick={onCreateProject}>New project</button>
      </div>
    </div>
    <div className="overall-progress-track" role="progressbar" aria-label="Tasks completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} aria-valuetext={`${completed} of ${tasks.length} tasks completed`}>
      {completedByProject.map(project => <div key={project.id} className="overall-progress-fill" title={`${project.name}: ${project.count} completed`} style={{ width: `${project.count / tasks.length * 100}%`, '--segment-color': `hsl(${project.hue}, 58%, 84%)` }} />)}
    </div>
    <div className="overall-progress-footer"><span><i className="progress-dot is-complete" />{completed} completed</span><span><i className="progress-dot" />{pending} remaining</span></div>
    <div className="project-pending-heading"><strong>Pending by project</strong><span>{pendingTotal} total</span></div>
    <ul className="project-pending-list">
      {projectPending.map(project => <li key={project.id} className={project.hasOverdue ? 'has-overdue' : ''}>
        <button type="button" className="project-pending-entry" onClick={() => onOpenProjectTasks(project.id)} aria-label={`Show ${project.name} tasks; ${project.count} pending`}>
          <span className="project-pending-name"><i style={{ backgroundColor: `hsl(${project.hue}, 58%, 48%)` }} aria-hidden="true" />{project.name}</span>
          <span className={`project-pending-count${project.count === 0 ? ' is-clear' : ''}`}>{project.count} pending</span>
        </button>
      </li>)}
    </ul>
  </section>
}
