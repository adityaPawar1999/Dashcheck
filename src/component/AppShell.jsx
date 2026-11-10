import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'
import ProjectTaskCard from './task/ProjectTaskCard.jsx'
import TaskProgress from './task/TaskProgress.jsx'
import LoginScreen from './auth/LoginScreen.jsx'
import TopNavbar from './navbar/TopNavbar.jsx'
import NotesPad from './notes/NotesPad.jsx'

const icon = { plus: '+' }
const projectColorOptions = [
  { name: 'Mint', hue: 150 },
  { name: 'Blue', hue: 210 },
  { name: 'Violet', hue: 270 },
  { name: 'Amber', hue: 35 },
  { name: 'Rose', hue: 350 },
  { name: 'Teal', hue: 185 },
]

function colorHueForIndex(index) {
  return (index * 137) % 360
}

function projectColorMap(projects) {
  const colors = new Map()
  const used = new Set()
  for (const project of projects) {
    if (Number.isInteger(project.color) && project.color >= 0 && project.color < 360 && !used.has(project.color)) {
      colors.set(project.id, project.color)
      used.add(project.color)
    }
  }
  let fallbackIndex = 0
  for (const project of projects) {
    if (colors.has(project.id)) continue
    while (fallbackIndex < 360 && used.has(colorHueForIndex(fallbackIndex))) fallbackIndex += 1
    const hue = colorHueForIndex(fallbackIndex)
    colors.set(project.id, hue)
    used.add(hue)
    fallbackIndex += 1
  }
  return colors
}

function App() {
  const [projects, setProjects] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectDialog, setProjectDialog] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(projectColorOptions[0].hue)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => onAuthStateChanged(auth, currentUser => { setUser(currentUser); setAuthLoading(false) }), [])

  useEffect(() => {
    if (!user?.email) return
    setDoc(doc(db, 'users', user.uid), { email: user.email }, { merge: true })
      .catch(err => setError(err.message))
  }, [user])

  useEffect(() => {
    if (!user) { setProjects([]); setLoading(false); return }
    setLoading(true)
    const projectsRef = collection(db, 'users', user.uid, 'projects')
    return onSnapshot(query(projectsRef, orderBy('createdAt', 'asc')), snapshot => {
    const next = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }))
    const originalOrder = new Map(next.map((project, index) => [project.id, index]))
    next.sort((a, b) => (Number.isFinite(a.position) ? a.position : originalOrder.get(a.id)) - (Number.isFinite(b.position) ? b.position : originalOrder.get(b.id)))
    setProjects(next)
    setLoading(false)
    setError('')
    }, err => { setError(err.message); setLoading(false) })
  }, [user])

  const userProjects = () => collection(db, 'users', user.uid, 'projects')

  const projectColors = projectColorMap(projects)

  function openCreateProject() {
    setEditingProjectId(null)
    setProjectName('')
    setProjectColor(projectColorOptions[0].hue)
    setProjectDialog(true)
  }

  function openRenameProject(project) {
    setEditingProjectId(project.id)
    setProjectName(project.name)
    setProjectColor(projectColors.get(project.id) ?? projectColorOptions[0].hue)
    setProjectDialog(true)
  }

  function closeProjectDialog() {
    setProjectDialog(false)
    setEditingProjectId(null)
    setProjectName('')
    setProjectColor(projectColorOptions[0].hue)
  }

  async function saveProject(event) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    try {
      if (editingProjectId) {
        await updateDoc(doc(db, 'users', user.uid, 'projects', editingProjectId), { name, color: projectColor })
      } else {
        await addDoc(userProjects(), { name, items: [], color: projectColor, position: projects.length, createdAt: serverTimestamp() })
      }
      setProjectName('')
      setEditingProjectId(null)
      setProjectDialog(false)
    } catch (err) { setError(err.message) }
  }

  async function removeProject(project) {
    if (!window.confirm(`Delete “${project.name}” and its checklist?`)) return
    try { await deleteDoc(doc(db, 'users', user.uid, 'projects', project.id)) }
    catch (err) { setError(err.message) }
  }

  if (authLoading) return <div className="loading-state"><span className="spinner" /> Connecting to Firebase…</div>

  async function saveProjectOrder(orderedProjects) {
    const batch = writeBatch(db)
    orderedProjects.forEach((project, index) => {
      batch.update(doc(db, 'users', user.uid, 'projects', project.id), { position: index })
    })
    try {
      await batch.commit()
      setProjects(orderedProjects.map((project, position) => ({ ...project, position })))
    } catch (err) { setError(err.message) }
  }

  function moveProject(projectId, direction) {
    const from = projects.findIndex(project => project.id === projectId)
    const to = from + direction
    if (from < 0 || to < 0 || to >= projects.length) return
    const reordered = [...projects]
    const [project] = reordered.splice(from, 1)
    reordered.splice(to, 0, project)
    saveProjectOrder(reordered)
  }

  if (!user) return <LoginScreen />

  return <div className="app-shell">
    <main className="main-content board-page">
      <TopNavbar userEmail={user.email} onError={setError} activeTab={activeTab} onTabChange={setActiveTab} />
      {error && <div className="error-banner"><b>Firebase needs attention</b><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
      <section className="board-content">
        {activeTab === 'notes' ? <NotesPad userId={user.uid} onError={setError} /> : <>
        <div className="board-heading"><div><div className="page-eyebrow">YOUR WORKSPACE</div><h1>Projects</h1><p>All your checklists, together in one place.</p></div><button className="primary-button" onClick={openCreateProject}><span>{icon.plus}</span> Create project</button></div>
        {loading ? <div className="loading-state"><span className="spinner" /> Loading your projects…</div> : projects.length ? <><TaskProgress projects={projects} projectColors={projectColors} /><div className="project-strip" aria-label="Your projects">
          {projects.map((project, index) => <ProjectTaskCard
            key={project.id}
            project={project}
            userId={user.uid}
            colorHue={projectColors.get(project.id)}
            projectIndex={index}
            projectCount={projects.length}
            onMoveProject={direction => moveProject(project.id, direction)}
            onRenameProject={openRenameProject}
            onDeleteProject={removeProject}
            onError={setError}
          />)}
        </div></> : <div className="board-empty"><div className="welcome-icon"><span>✓</span></div><h2>Your first project is one click away</h2><p>Create a project to start adding tasks and check them off as you go.</p><button className="primary-button" onClick={() => setProjectDialog(true)}><span>{icon.plus}</span> Create your first project</button></div>}
        </>}
      </section>
      <footer className="footer"><span>Copyright {new Date().getFullYear()} Dashcheck</span><span className="footer-contact">Need help? <a href="mailto:adityapawar8909@gmail.com">adityapawar8909@gmail.com</a></span></footer>
    </main>

    {projectDialog && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeProjectDialog()}><form className="modal" onSubmit={saveProject}><button type="button" className="modal-close" onClick={closeProjectDialog}>×</button><div className="modal-icon">▱</div><div className="page-eyebrow">{editingProjectId ? 'EDIT PROJECT' : 'NEW PROJECT'}</div><h2>{editingProjectId ? 'Edit your project' : 'What are you working on?'}</h2><p>{editingProjectId ? 'Update the name or choose a new color.' : 'Give your project a name and color to get started.'}</p><label htmlFor="project-name">Project name</label><input id="project-name" autoFocus maxLength="70" placeholder="e.g. Launch my portfolio" value={projectName} onChange={event => setProjectName(event.target.value)} /><fieldset className="project-color-field"><legend>Project color</legend><div className="project-color-options" role="radiogroup" aria-label="Choose project color">{projectColorOptions.map(option => <button key={option.hue} type="button" role="radio" aria-checked={projectColor === option.hue} aria-label={option.name} title={option.name} className={`project-color-option ${projectColor === option.hue ? 'is-selected' : ''}`} style={{ '--swatch-hue': option.hue }} onClick={() => setProjectColor(option.hue)}>{projectColor === option.hue && <span aria-hidden="true">✓</span>}</button>)}</div><span className="project-color-label">{projectColorOptions.find(option => option.hue === projectColor)?.name ?? 'Custom'}</span></fieldset><div className="modal-actions"><button type="button" className="secondary-button" onClick={closeProjectDialog}>Cancel</button><button className="primary-button" type="submit">{editingProjectId ? 'Save changes' : 'Create project'} <span>→</span></button></div></form></div>}
  </div>
}

export default App
