import { useMemo, useState, type FormEvent } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import toast from 'react-hot-toast'
import { ChallengeAxis, CHALLENGE_AXIS_LABELS } from '@naht/shared'
import { createChallenge, type Challenge } from '../lib/challenges'

const STATUS_COLOR: Record<Challenge['status'], string> = {
  pending: '#2563eb',
  success: '#16a34a',
  failed: '#dc2626',
}

interface AgendaCalendarProps {
  projectId: string
  me: string
  challenges: Challenge[]
  onChanged: () => Promise<void> | void
}

export function AgendaCalendar({
  projectId,
  me,
  challenges,
  onChanged,
}: AgendaCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [axis, setAxis] = useState<ChallengeAxis>(ChallengeAxis.SPORT)
  const [saving, setSaving] = useState(false)

  const events = useMemo(
    () =>
      challenges
        .filter((c) => c.assigned_to === me && c.due_date)
        .map((c) => ({
          id: c.id,
          title: `${c.status === 'success' ? '✅ ' : c.status === 'failed' ? '❌ ' : ''}${c.title}`,
          start: c.due_date as string,
          allDay: true,
          backgroundColor: STATUS_COLOR[c.status],
          borderColor: STATUS_COLOR[c.status],
        })),
    [challenges, me],
  )

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!selectedDate) return
    setSaving(true)
    try {
      await createChallenge({
        projectId,
        assignedTo: me,
        title: title.trim(),
        axis,
        dueDate: selectedDate,
      })
      setTitle('')
      setSelectedDate(null)
      await onChanged()
      toast.success('Ajouté à ton agenda')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        firstDay={1}
        height="auto"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
        buttonText={{ today: "Aujourd'hui" }}
        events={events}
        dateClick={(arg) => {
          setSelectedDate(arg.dateStr)
          setTitle('')
        }}
      />

      {selectedDate && (
        <form
          onSubmit={handleAdd}
          className="mt-4 space-y-3 rounded-xl border border-primary-200 bg-primary-50 p-4"
        >
          <p className="text-sm font-medium text-gray-800">
            Ajouter un challenge le{' '}
            {new Date(selectedDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <input
            type="text"
            required
            autoFocus
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : courir 5 km"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <select
              value={axis}
              onChange={(e) => setAxis(e.target.value as ChallengeAxis)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {Object.values(ChallengeAxis).map((a) => (
                <option key={a} value={a}>
                  {CHALLENGE_AXIS_LABELS[a]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
