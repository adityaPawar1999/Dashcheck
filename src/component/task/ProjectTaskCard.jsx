import { useEffect, useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

function pendingAge(createdAt, now) {
  const created = typeof createdAt === 'number'
    ? createdAt
    : createdAt?.toMillis?.() ?? (createdAt instanceof Date ? createdAt.getTime() : NaN)
  if (!Number.isFinite(created)) return 'Pending age unavailable'
  const days = Math.max(0, Math.floor((now - created) / 86400000))
  return days === 0 ? 'Pending today' : `Pending ${days} day${days === 1 ? '' : 's'}`
}

function createdTime(createdAt) {
  if (typeof createdAt === 'number') return createdAt
  if (createdAt instanceof Date) return createdAt.getTime()
  return createdAt?.toMillis?.() ?? 0
}

export default function ProjectTaskCard({ project, userId, colorHue, projectIndex, projectCount, onMoveProject, onRenameProject, onDeleteProject, onError, highlightTasks }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [now, setNow] = useState(Date.now())
  const projectCardRef = useRef(null)

  const items = project.items ?? []
  const sortedItems = [...items].sort((a, b) =>
    Number(Boolean(b.starred)) - Number(Boolean(a.starred)) || createdTime(b.createdAt) - createdTime(a.createdAt),
  )
  const completed = items.filter(item => item.done).length
  const progress = items.length ? Math.round(completed / items.length * 100) : 0

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (highlightTasks) projectCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightTasks])

  useEffect(() => {
    if (!openMenu) return
    const closeOutsideMenu = event => {
      if (event.target instanceof Element && !event.target.closest('.menu-wrap')) setOpenMenu(null)
    }
    const closeOnEscape = event => { if (event.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('pointerdown', closeOutsideMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutsideMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenu])

  function openAddItem() {
    setEditingItemId(null)
    setTitle('')
    setDescription('')
    setDialogOpen(true)
  }

  function openEditItem(item) {
    setEditingItemId(item.id)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingItemId(null)
    setTitle('')
    setDescription('')
  }

  async function saveItem(event) {
    event.preventDefault()
    if (!title.trim()) return
    const updatedItems = editingItemId
      ? items.map(item => item.id === editingItemId ? { ...item, title: title.trim(), description: description.trim() } : item)
      : [...items, { id: crypto.randomUUID(), title: title.trim(), description: description.trim(), done: false, starred: false, createdAt: Date.now() }]
    try {
      await updateDoc(doc(db, 'users', userId, 'projects', project.id), { items: updatedItems })
      closeDialog()
    } catch (error) { onError(error.message) }
  }

  async function updateItem(id, changes) {
    const updatedItems = items.map(item => item.id === id ? { ...item, ...changes } : item)
    try { await updateDoc(doc(db, 'users', userId, 'projects', project.id), { items: updatedItems }) }
    catch (error) { onError(error.message) }
  }

  async function removeItem(id) {
    try {
      await updateDoc(doc(db, 'users', userId, 'projects', project.id), { items: items.filter(item => item.id !== id) })
    } catch (error) { onError(error.message) }
  }

  const projectMenuId = `project-${project.id}`

  return <article ref={projectCardRef} className={`project-card${highlightTasks ? ' is-highlighted' : ''}`} style={{ '--card-hue': colorHue }}>
    <div className="project-card-banner">
    <div className="project-card-head">
      <h2 className="project-card-name" title={project.name}>{project.name}</h2>
      <div className="project-card-actions">
        <button className="card-add-task" onClick={openAddItem}><span>+</span> Add task</button>
        <div className="menu-wrap">
          <button className="more-button" aria-label={`More options for ${project.name}`} aria-haspopup="menu" aria-expanded={openMenu === projectMenuId} onClick={() => setOpenMenu(openMenu === projectMenuId ? null : projectMenuId)}>⋮</button>
          {openMenu === projectMenuId && <div className="action-menu" role="menu">
            <button role="menuitem" disabled={projectIndex === 0} onClick={() => { setOpenMenu(null); onMoveProject(-1) }}>Move left</button>
            <button role="menuitem" disabled={projectIndex === projectCount - 1} onClick={() => { setOpenMenu(null); onMoveProject(1) }}>Move right</button>
            <button role="menuitem" onClick={() => { setOpenMenu(null); onRenameProject(project) }}>Rename project</button>
            <button className="menu-danger" role="menuitem" onClick={() => { setOpenMenu(null); onDeleteProject(project) }}>Delete project</button>
          </div>}
        </div>
      </div>
    </div>
    <div className="project-card-progress"><span>{completed}/{items.length} complete</span><b>{progress}%</b></div>
    <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
    </div>
    <div className="project-card-tasks">
      {sortedItems.map(item => {
        const taskMenuId = `task-${project.id}-${item.id}`
        return <article className={`task-card ${item.done ? 'is-done' : ''} ${item.starred ? 'is-starred' : ''}`} key={item.id}>
          <button className="checkbox" onClick={() => updateItem(item.id, { done: !item.done })} aria-label={item.done ? 'Mark as not done' : 'Mark as done'}>{item.done && '✓'}</button>
          <div className="task-copy">
            <div className="task-line"><h3>{item.title}</h3></div>
            {!item.done && <span className="task-age">{pendingAge(item.createdAt, now)}</span>}
            {item.description && <p>{item.description}</p>}
          </div>
          <button className="star-toggle" onClick={() => updateItem(item.id, { starred: !item.starred })} aria-label={item.starred ? `Unstar ${item.title}` : `Star ${item.title}`} aria-pressed={Boolean(item.starred)} title={item.starred ? 'Unstar task' : 'Star task'}>{item.starred ? '★' : '☆'}</button>
          <div className="task-actions menu-wrap">
            <button className="more-button task-more-button" aria-label={`More options for ${item.title}`} aria-haspopup="menu" aria-expanded={openMenu === taskMenuId} onClick={() => setOpenMenu(openMenu === taskMenuId ? null : taskMenuId)}>⋮</button>
            {openMenu === taskMenuId && <div className="action-menu" role="menu">
              <button role="menuitem" onClick={() => { setOpenMenu(null); openEditItem(item) }}>Edit task</button>
              <button className="menu-danger" role="menuitem" onClick={() => { setOpenMenu(null); removeItem(item.id) }}>Delete task</button>
            </div>}
          </div>
        </article>
      })}
      {!items.length && <p className="no-tasks">No tasks yet</p>}
    </div>

    {dialogOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeDialog()}>
      <form className="modal" onSubmit={saveItem}>
        <button type="button" className="modal-close" onClick={closeDialog}>×</button>
        <div className="modal-icon">☑</div>
        <div className="page-eyebrow">{editingItemId ? 'EDIT CHECKLIST ITEM' : 'NEW CHECKLIST ITEM'}</div>
        <h2>{editingItemId ? 'Edit task' : 'Add a task'}</h2>
        <p>{editingItemId ? 'Update the task name or description.' : `Write down one clear next step for ${project.name}.`}</p>
        <label htmlFor={`task-title-${project.id}`}>Task name</label>
        <input id={`task-title-${project.id}`} autoFocus maxLength="100" placeholder="e.g. Draft the project outline" value={title} onChange={event => setTitle(event.target.value)} />
        <label htmlFor={`task-description-${project.id}`}>Description <span className="optional">OPTIONAL</span></label>
        <textarea id={`task-description-${project.id}`} rows="3" maxLength="300" placeholder="Add a little context if it helps…" value={description} onChange={event => setDescription(event.target.value)} />
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={closeDialog}>Cancel</button>
          <button className="primary-button" type="submit">{editingItemId ? 'Save changes' : 'Add task'} <span>→</span></button>
        </div>
      </form>
    </div>}
  </article>
}
