import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import ProjectTaskCard from './task/ProjectTaskCard.jsx'
import TaskProgress from './task/TaskProgress.jsx'
import LoginScreen from './auth/LoginScreen.jsx'
import TopNavbar from './navbar/TopNavbar.jsx'

const icon = { plus: '+' }

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

function nextProjectHue(projects) {
  const used = new Set(projectColorMap(projects).values())
  for (let index = 0; index < 360; index += 1) {
    const hue = colorHueForIndex(index)
    if (!used.has(hue)) return hue
  }
  return colorHueForIndex(projects.length)
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

  useEffect(() => onAuthStateChanged(auth, currentUser => { setUser(currentUser); setAuthLoading(false) }), [])

  useEffect(() => {
    if (!user) { setProjects([]); setLoading(false); return }
    setLoading(true)
    const projectsRef = collection(db, 'users', user.uid, 'projects')
    return onSnapshot(query(projectsRef, orderBy('createdAt', 'asc')), snapshot => {
    const next = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }))
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
    setProjectDialog(true)
  }

  function openRenameProject(project) {
    setEditingProjectId(project.id)
    setProjectName(project.name)
    setProjectDialog(true)
  }

  function closeProjectDialog() {
    setProjectDialog(false)
    setEditingProjectId(null)
    setProjectName('')
  }

  async function saveProject(event) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    try {
      if (editingProjectId) {
        await updateDoc(doc(db, 'users', user.uid, 'projects', editingProjectId), { name })
      } else {
        await addDoc(userProjects(), { name, items: [], color: nextProjectHue(projects), createdAt: serverTimestamp() })
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

  if (!user) return <LoginScreen />

  return <div className="app-shell">
    <main className="main-content board-page">
      <TopNavbar userEmail={user.email} onError={setError} />
      {error && <div className="error-banner"><b>Firebase needs attention</b><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
      <section className="board-content">
        <div className="board-heading"><div><div className="page-eyebrow">YOUR WORKSPACE</div><h1>Projects</h1><p>All your checklists, together in one place.</p></div><button className="primary-button" onClick={openCreateProject}><span>{icon.plus}</span> Create project</button></div>
        {loading ? <div className="loading-state"><span className="spinner" /> Loading your projects…</div> : projects.length ? <><TaskProgress projects={projects} /><div className="project-strip" aria-label="Your projects">
          {projects.map(project => <ProjectTaskCard key={project.id} project={project} userId={user.uid} colorHue={projectColors.get(project.id)} onRenameProject={openRenameProject} onDeleteProject={removeProject} onError={setError} />)}
        </div></> : <div className="board-empty"><div className="welcome-icon"><span>✓</span></div><h2>Your first project is one click away</h2><p>Create a project to start adding tasks and check them off as you go.</p><button className="primary-button" onClick={() => setProjectDialog(true)}><span>{icon.plus}</span> Create your first project</button></div>}
      </section>
      <footer className="footer">Made for steady progress <span>✳</span></footer>
    </main>

    {projectDialog && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeProjectDialog()}><form className="modal" onSubmit={saveProject}><button type="button" className="modal-close" onClick={closeProjectDialog}>×</button><div className="modal-icon">▱</div><div className="page-eyebrow">{editingProjectId ? 'EDIT PROJECT' : 'NEW PROJECT'}</div><h2>{editingProjectId ? 'Rename your project' : 'What are you working on?'}</h2><p>{editingProjectId ? 'Choose a name that makes this project easy to find.' : 'Give your project a name to get started.'}</p><label htmlFor="project-name">Project name</label><input id="project-name" autoFocus maxLength="70" placeholder="e.g. Launch my portfolio" value={projectName} onChange={event => setProjectName(event.target.value)} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={closeProjectDialog}>Cancel</button><button className="primary-button" type="submit">{editingProjectId ? 'Save changes' : 'Create project'} <span>→</span></button></div></form></div>}
  </div>
}

export default App
