import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/localdb/store';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    const data = await db.entities.Project.list('-created_date');
    setProjects(data);
    if (!currentProject && data.length > 0) {
      setCurrentProject(data[0]);
    } else if (currentProject) {
      const updated = data.find(p => p.id === currentProject.id);
      if (updated) setCurrentProject(updated);
      else if (data.length > 0) setCurrentProject(data[0]);
      else setCurrentProject(null);
    }
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const selectProject = (project) => setCurrentProject(project);

  const refreshProject = async () => {
    if (!currentProject) return;
    const updated = await db.entities.Project.get(currentProject.id);
    setCurrentProject(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <ProjectContext.Provider value={{ projects, currentProject, selectProject, loadProjects, refreshProject, loading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
