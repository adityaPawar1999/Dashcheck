export default function TaskProgress({ projects, projectColors }) {
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

  return <section className="overall-progress" aria-label="Overall task progress">
    <div className="overall-progress-top">
      <div className="overall-progress-heading">
        <span className="overall-progress-icon" aria-hidden="true">&#10003;</span>
        <div>
          <strong>Workspace progress</strong>
          <span>{completed} of {tasks.length} tasks completed</span>
        </div>
      </div>
      <div className="overall-progress-score"><b>{progress}%</b><span>complete</span></div>
    </div>
    <div className="overall-progress-track" role="progressbar" aria-label="Tasks completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} aria-valuetext={`${completed} of ${tasks.length} tasks completed`}>
      {completedByProject.map(project => <div key={project.id} className="overall-progress-fill" title={`${project.name}: ${project.count} completed`} style={{ width: `${project.count / tasks.length * 100}%`, '--segment-color': `hsl(${project.hue}, 58%, 84%)` }} />)}
    </div>
    <div className="overall-progress-footer"><span><i className="progress-dot is-complete" />{completed} completed</span><span><i className="progress-dot" />{pending} remaining</span></div>
  </section>
}
