import React, { useState } from 'react';
import {
  Calendar, CheckCircle, Clock, Users, BookOpen, Youtube,
  HardDrive, ExternalLink, MessageCircle, Clipboard, Play
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

function toDateSafe(input: any): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  if (typeof input === 'string' || typeof input === 'number') return new Date(input);
  if (typeof input?.toDate === 'function') return input.toDate();
  if (typeof input?.seconds === 'number') return new Date(input.seconds * 1000);
  return new Date(NaN);
}
function normalizeMaterialUrl(raw: string) {
  let url = (raw || '').trim();
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be' && u.pathname.length > 1) {
      url = `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes('drive.google.com')) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = match ? match[1] : (u.searchParams.get('id') || '');
      if (id) url = `https://drive.google.com/file/d/${id}/view`;
    }
  } catch {}
  return { url };
}
function materialBadge(material: { url: string; type?: string }): string {
    const u = (material.url || '').toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
    if (u.includes('drive.google.com')) return 'Google Drive';
    if (/[.]pdf(\?|$)/.test(u)) return 'PDF';
    return (material.type || 'Documento').toString();
}
async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        alert('Link copiado!');
    } catch {
        alert('Falha ao copiar.');
    }
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const data = useData() as any;
  const { classes, lessons: lessonsFlat, getStudentClasses, getClassLessons, hasAttendance, markAttendance } = data;

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const studentClasses = user ? getStudentClasses(user.id) : [];
  const candidateLessons = studentClasses.flatMap((c: any) =>
    (getClassLessons(c.id) || []).map((l: any) => ({
      ...l,
      className: c.name,
      date: toDateSafe(l.date)
    }))
  );

  const upcomingLessons = candidateLessons.sort((a, b) => a.date.getTime() - b.date.getTime());
  const filteredLessons = upcomingLessons.filter(lesson => {
    const textMatch = !filterText || lesson.title.toLowerCase().includes(filterText.toLowerCase());
    const dateMatch = !filterDate || lesson.date.toISOString().slice(0, 10) === filterDate;
    return textMatch && dateMatch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Minhas Aulas</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input aria-label="Buscar aulas" type="text" placeholder="Buscar por título..." className="px-3 py-2 border rounded-lg flex-1" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
        <input aria-label="Filtrar por data" type="date" className="px-3 py-2 border rounded-lg" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl text-gray-500"><p>Nenhuma aula encontrada para você.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLessons.map((lesson: any) => {
            const present = hasAttendance && user ? hasAttendance(user.id, lesson.id) : false;
            const dt = lesson.date;
            return (
              <div key={lesson.id} className="bg-white rounded-2xl shadow-sm p-4 border flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{lesson.className}</span>
                    {present && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium"><CheckCircle className="w-4 h-4" /> Presença Confirmada</span>)}
                  </div>
                  <h2 className="text-xl font-semibold">{lesson.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-3">
                    <div className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> <span>{dt.toLocaleDateString()}</span></div>
                    <div className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> <span>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Materiais</h3>
                    {!present ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Atenção:</strong> Você precisa marcar presença para acessar os materiais desta aula.
                        </p>
                      </div>
                    ) : lesson.materials && lesson.materials.length > 0 ? (
                      <div className="space-y-3">
                        {lesson.materials.map((material: any) => {
                          const { url } = normalizeMaterialUrl(material.url);
                          const badge = materialBadge(material);
                          return (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                  {badge === 'YouTube' ? <Youtube className="w-5 h-5 text-red-500" /> : badge === 'Google Drive' ? <HardDrive className="w-5 h-5 text-blue-600" /> : <BookOpen className="w-5 h-5" />}
                                </div>
                                <div className="overflow-hidden"><p className="font-medium text-gray-900 truncate">{material.name}</p><span className="text-xs text-gray-500">{badge}</span></div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {badge === 'YouTube' && <button onClick={() => { setPreviewUrl(url); setShowPreview(true); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Play className="w-4 h-4" /></button>}
                                <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><ExternalLink className="w-4 h-4" /></a>
                                <button onClick={() => copyToClipboard(url)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"><Clipboard className="w-4 h-4" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-sm text-gray-500">Nenhum material.</p>}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" /> <span>Turma: {lesson.className}</span></div>
                  <div>
                    {present ? (<span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700"><CheckCircle className="w-4 h-4" /> Presente</span>) : (<button onClick={() => markAttendance && user && markAttendance(user.id, lesson.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><CheckCircle className="w-4 h-4" /> Marcar Presença</button>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-full bg-black">
              <iframe className="w-full h-full" src={previewUrl.replace('watch?v=', 'embed/')} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}