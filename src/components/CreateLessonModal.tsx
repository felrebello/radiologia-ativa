import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

type MaterialType = 'pdf' | 'video' | 'image' | 'document';

type Material = {
  id: string;
  name: string;
  type: MaterialType;
  url: string;
  size?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    description?: string;
    date: Date | string;
    duration?: number;
    materials: Material[];
  }) => void;
};

function normalizeUrl(raw: string): { url: string; type: MaterialType } {
  let url = (raw || '').trim();
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be' && u.pathname.length > 1) {
      const id = u.pathname.slice(1);
      url = `https://www.youtube.com/watch?v=${id}`;
    }
    if (u.hostname.includes('drive.google.com')) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m ? m[1] : (u.searchParams.get('id') || '');
      if (id) url = `https://drive.google.com/file/d/${id}/view`;
    }
  } catch {}
  const lower = url.toLowerCase();
  let type: MaterialType = 'document';
  if (lower.includes('youtube.com/watch') || lower.includes('youtu.be/')) type = 'video';
  else if (/[.]pdf(\?|$)/.test(lower)) type = 'pdf';
  else if (/[.](png|jpg|jpeg|gif|webp|svg)(\?|$)/.test(lower)) type = 'image';
  else if (/[.](mp4|mov|avi|mkv)(\?|$)/.test(lower)) type = 'video';
  return { url, type };
}

export default function CreateLessonModal({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<string>('');
  const [time, setTime] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(60);

  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [matName, setMatName] = React.useState('');
  const [matUrl, setMatUrl] = React.useState('');

  if (!isOpen) return null;

  function addMaterial() {
    if (!matName || !matUrl) return;
    const norm = normalizeUrl(matUrl);
    const newMaterial: Material = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      name: matName,
      type: norm.type,
      url: norm.url,
      size: 0,
    };
    setMaterials(prev => [...prev, newMaterial]);
    setMatName('');
    setMatUrl('');
  }

  function removeMaterial(id: string) {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }

  function handleCreate() {
    if (!title || !date || !time) return;
    const dt = new Date(`${date}T${time}`);
    onCreate({ title, description, date: dt, duration, materials });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Nova Aula</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Título</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Duração (min)</label>
              <input type="number" value={duration} onChange={e=>setDuration(Number(e.target.value||60))} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Descrição</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>

          {/* Materiais por URL */}
          <div className="border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Materiais (via URL)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input
                aria-label="Nome do material"
                placeholder="Nome do material"
                className="border rounded-lg px-3 py-2"
                value={matName}
                onChange={e=>setMatName(e.target.value)}
              />
              <input
                aria-label="URL do material"
                placeholder="https://..."
                className="border rounded-lg px-3 py-2 md:col-span-2"
                value={matUrl}
                onChange={e=>setMatUrl(e.target.value)}
              />
            </div>

            <button onClick={addMaterial} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Adicionar
            </button>

            {materials.length > 0 && (
              <div className="mt-3 space-y-2">
                {materials.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.type.toUpperCase()} • {m.url}</div>
                    </div>
                    <button onClick={()=>removeMaterial(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label="Remover material">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">Cancelar</button>
          <button onClick={handleCreate} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Criar Aula</button>
        </div>
      </div>
    </div>
  );
}
