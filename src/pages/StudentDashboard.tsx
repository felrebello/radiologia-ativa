// src/pages/StudentDashboard.tsx
import React from 'react';
import {
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Youtube,
  HardDrive,
  ExternalLink,
  MessageCircle,
  Clipboard,
  Play
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

/* ===================== Helpers ===================== */

// Converte qualquer valor de data para Date real (Firestore Timestamp, string, Date)
function toDateSafe(input: any): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  if (typeof input === 'string' || typeof input === 'number') return new Date(input);
  if (typeof input?.toDate === 'function') return input.toDate();                // Firestore Timestamp
  if (typeof input?.seconds === 'number') return new Date(input.seconds * 1000); // {seconds, nanoseconds}
  return new Date(NaN);
}

// Normaliza URL (YouTube/Drive) e detecta tipo
function normalizeMaterialUrl(raw: string): {
  url: string;
  type: 'pdf' | 'video' | 'image' | 'document';
  vendor?: 'youtube' | 'drive';
} {
  let url = (raw || '').trim();
  try {
    const u = new URL(url);
    // youtu.be -> youtube.com/watch?v=
    if (u.hostname === 'youtu.be' && u.pathname.length > 1) {
      const id = u.pathname.slice(1);
      url = `https://www.youtube.com/watch?v=${id}`;
    }
    // drive: file/d/{id} -> /view  | ou ?id=
    if (u.hostname.includes('drive.google.com')) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = match ? match[1] : (u.searchParams.get('id') || '');
      if (id) url = `https://drive.google.com/file/d/${id}/view`;
    }
  } catch {
    // mantém original se não for URL válida
  }

  const lower = url.toLowerCase();
  let type: 'pdf' | 'video' | 'image' | 'document' = 'document';
  let vendor: 'youtube' | 'drive' | undefined;

  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) {
    type = 'video';
    vendor = 'youtube';
  } else if (lower.includes('drive.google.com')) {
    vendor = 'drive';
    if (/[.]pdf(\?|$)/.test(lower)) type = 'pdf';
  } else if (/[.]pdf(\?|$)/.test(lower)) type = 'pdf';
  else if (/[.](png|jpg|jpeg|gif|webp|svg)(\?|$)/.test(lower)) type = 'image';
  else if (/[.](mp4|mov|avi|mkv)(\?|$)/.test(lower)) type = 'video';

  return { url, type, vendor };
}

function materialBadge(material: { url: string; type?: string }) {
  const u = (material.url || '').toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('drive.google.com')) return 'Google Drive';
  if (/[.]pdf(\?|$)/.test(u)) return 'PDF';
  if (/[.](png|jpg|jpeg|gif|webp|svg)(\?|$)/.test(u)) return 'Imagem';
  return (material.type || 'Documento').toString();
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function escapeIcs(s: string) {
  return (s || '').replace(/[\\;,\n]/g, (m) => ({ '\\': '\\\\', ';': '\\;', ',': '\\,', '\n': '\\n' } as any)[m]);
}

function buildIcs(lesson: any) {
  const dt = toDateSafe(lesson.date);
  const pad = (n: number) => String(n).padStart(2, '0');
  const toUTC = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
      d.getUTCMinutes()
    )}00Z`;
  const start = new Date(dt);
  const end = new Date(dt.getTime() + (lesson.duration || 60) * 60000);
  const uid = `${lesson.id || Date.now()}@nort-app`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nort Radiologia//Aulas//PT-BR',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUTC(new Date())}`,
    `DTSTART:${toUTC(start)}`,
    `DTEND:${toUTC(end)}`,
    `SUMMARY:${escapeIcs(lesson.title || 'Aula')}`,
    `DESCRIPTION:${escapeIcs(lesson.description || '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Link copiado!');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Link copiado!');
  }
}

/* ===================== Página do Aluno ===================== */

export function StudentDashboard() {
  const { user } = useAuth();

  // useData defensivo
  const data = useData() as any;
  const classes               = data?.classes ?? [];
  const lessonsFlat           = data?.lessons ?? data?.allLessons ?? [];
  const getStudentClasses     = data?.getStudentClasses ?? (() => classes);
  const getClassLessons       = data?.getClassLessons ?? ((classId: string) => {
    const cls = (classes || []).find((c: any) => c?.id === classId);
    return cls?.lessons ?? [];
  });
  const getAllLessons         = data?.getAllLessons;
  const hasAttendance         = data?.hasAttendance ?? (() => false);
  const markAttendance        = data?.markAttendance ?? (() => {});

  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [showPreview, setShowPreview] = React.useState(false);

  // filtros (sem turma)
  const [filterText, setFilterText] = React.useState('');
  const [filterDate, setFilterDate] = React.useState<string>('');

  // ======= Montagem de aulas (multi-origem, sem async) =======
  function mapToLessonArray(raw: any[], fallbackClassName?: string) {
    return (raw || []).map((l: any) => ({
      ...l,
      className: l?.className || fallbackClassName || 'Turma',
      date: toDateSafe(l?.date),
    }));
  }

  let candidateLessons: any[] = [];

  // 1) turmas do aluno -> lessons por turma
  try {
    const studentClasses = getStudentClasses() || [];
    const byClasses = studentClasses.flatMap((c: any) =>
      mapToLessonArray(
        (getClassLessons ? getClassLessons(c.id) : (c?.lessons || [])) || [],
        c?.name
      )
    );
    if (byClasses.length) candidateLessons = byClasses;
  } catch { /* ignora */ }

  // 2) fallback: lista global de lessons (se existir)
  if (!candidateLessons.length) {
    try {
      const globalList = typeof getAllLessons === 'function' ? getAllLessons() : lessonsFlat;
      const all = mapToLessonArray(globalList || []);
      if (all.length) candidateLessons = all;
    } catch { /* ignora */ }
  }

  // ordena
  const upcomingLessons = (candidateLessons || []).sort(
    (a: any, b: any) => toDateSafe(a.date).getTime() - toDateSafe(b.date).getTime()
  );

  // filtros na UI
  const filteredLessons = upcomingLessons.filter((lesson: any) => {
    const text = (lesson.title + ' ' + (lesson.description || '')).toLowerCase();
    const passText = !filterText || text.includes(filterText.toLowerCase());
    const passDate =
      !filterDate || toDateSafe(lesson.date).toISOString().slice(0, 10) === filterDate;
    return passText && passDate;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minhas Aulas</h1>
        <p className="text-gray-600 mb-4">
          Aulas das turmas em que você está matriculado
        </p>

        {/* Filtros (texto + data) */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
          <input
            aria-label="Buscar aulas"
            type="text"
            placeholder="Buscar por título ou descrição"
            className="px-3 py-2 border rounded-lg flex-1"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <input
            aria-label="Filtrar por data"
            type="date"
            className="px-3 py-2 border rounded-lg"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl text-gray-500">
          Nenhuma aula encontrada com os filtros atuais.
          <div className="mt-2">
            Precisa de ajuda?{' '}
            <a
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/5521972537897?text=${encodeURIComponent(
                'Olá! Sou ' +
                  (user?.displayName || user?.email || 'Aluno(a)') +
                  '. Não encontrei minhas aulas.'
              )}`}
            >
              Fale com a coordenação
            </a>
            .
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLessons.map((lesson: any) => {
            const present = hasAttendance ? hasAttendance(lesson.id) : false;
            const dt = toDateSafe(lesson.date);

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {lesson.className || 'Turma'}
                      </span>
                      {present && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Presença Confirmada
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold">{lesson.title}</h2>
                  </div>
                </div>

                {/* Metadados */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                  <div className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{dt.toLocaleDateString()}</span>
                  </div>
                  <div className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                      {lesson.duration} min)
                    </span>
                  </div>

                  {/* Adicionar ao calendário */}
                  <button
                    aria-label="Adicionar ao calendário"
                    onClick={() => {
                      const ics = buildIcs(lesson);
                      const blob = new Blob([ics], {
                        type: 'text/calendar;charset=utf-8'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = (lesson.title || 'aula') + '.ics';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 border rounded-lg text-xs hover:bg-gray-100"
                  >
                    Adicionar ao calendário
                  </button>
                </div>

                {/* Materiais */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Materiais da Aula
                  </h3>

                  {lesson.materials && lesson.materials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lesson.materials.map((material: any) => {
                        const norm = normalizeMaterialUrl(material.url);
                        const badge = materialBadge({
                          url: norm.url,
                          type: material.type
                        });
                        return (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                {badge === 'YouTube' ? (
                                  <Youtube className="w-5 h-5 text-red-500" aria-hidden="true" />
                                ) : badge === 'Google Drive' ? (
                                  <HardDrive className="w-5 h-5 text-blue-600" aria-hidden="true" />
                                ) : badge === 'PDF' ? (
                                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                                ) : badge === 'Imagem' ? (
                                  <ExternalLink className="w-5 h-5" aria-hidden="true" />
                                ) : (
                                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{material.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border">
                                    {badge}
                                  </span>
                                  {material.size > 0 && (
                                    <span>{formatFileSize(material.size)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Preview YouTube */}
                              {badge === 'YouTube' && (
                                <button
                                  aria-label="Pré-visualizar vídeo"
                                  onClick={() => {
                                    setPreviewUrl(norm.url);
                                    setShowPreview(true);
                                  }}
                                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Pré-visualizar"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {/* Abrir */}
                              <a
                                href={norm.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Abrir"
                                aria-label="Abrir material"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {/* Copiar link */}
                              <button
                                onClick={() => copyToClipboard(norm.url)}
                                className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Copiar link"
                                aria-label="Copiar link do material"
                              >
                                <Clipboard className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                      Nenhum material adicionado para esta aula.
                      <div className="mt-2">
                        Precisa de ajuda?{' '}
                        <a
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://wa.me/5521972537897?text=${encodeURIComponent(
                            'Olá! Sou ' +
                              (user?.displayName || user?.email || 'Aluno(a)') +
                              '. Não encontrei materiais da aula ' +
                              (lesson?.title || '') +
                              '.'
                          )}`}
                        >
                          Fale com a coordenação
                        </a>
                        .
                      </div>
                    </div>
                  )}

                  {/* Botão WhatsApp no rodapé dos materiais (único) */}
                  <div className="mt-3 flex justify-end">
                    <a
                      href={`https://wa.me/5521972537897?text=${encodeURIComponent(
                        `Olá, sou ${user?.displayName || user?.email || 'Aluno(a)'} da turma ${
                          lesson.className
                        }. Dúvida sobre a aula "${lesson.title}" em ${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}: `
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                      title="Enviar dúvida (WhatsApp)"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Tirar dúvida
                    </a>
                  </div>
                </div>

                {/* Presença */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Turma: {lesson.className}</span>
                  </div>
                  <div>
                    {present ? (
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Presente
                      </span>
                    ) : (
                      <button
                        onClick={() => markAttendance && markAttendance(lesson.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar Presença
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h4 className="font-semibold">Pré-visualização</h4>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setShowPreview(false)}
                aria-label="Fechar pré-visualização"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {previewUrl.includes('youtube.com/watch') ? (
                <iframe
                  className="w-full h-full"
                  src={previewUrl.replace('watch?v=', 'embed/')}
                  title="Pré-visualização do vídeo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="p-6 text-gray-600">
                  Prévia não suportada. Abra o material no botão “Abrir”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

