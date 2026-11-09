export default function TaskProgress({ projects }) {
  const tasks = projects.flatMap(project => project.items ?? [])
  const completed = tasks.filter(task => task.done).length
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0

  return <section className="overall-progress" aria-label="Overall task progress">
    <div className="overall-progress-copy">
      <div><strong>Overall progress</strong><span>{completed} of {tasks.length} tasks completed · {tasks.length - completed} pending</span></div>
      <b>{progress}%</b>
    </div>
    <div className="overall-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
      <div className="overall-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  </section>
}
