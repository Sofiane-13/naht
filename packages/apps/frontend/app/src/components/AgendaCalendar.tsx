import { useMemo, useState, type FormEvent } from 'react'
import FullCalendar from '@fullcalendar/react'
import type { EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import toast from 'react-hot-toast'
import { ChallengeAxis, CHALLENGE_AXIS_LABELS } from '@naht/shared'
import {
  createChallenge,
  type Challenge,
  type Recurrence,
} from '../lib/challenges'

const STATUS_COLOR: Record<Challenge['status'], string> = {
  pending: '#2563eb',
  success: '#16a34a',
  failed: '#dc2626',
}

const WD_CODES = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']
// Ordre d'affichage lundi -> dimanche, avec l'index JS getDay() (0=dim).
const WEEKDAYS: { index: number; label: string }[] = [
  { index: 1, label: 'L' },
  { index: 2, label: 'M' },
  { index: 3, label: 'M' },
  { index: 4, label: 'J' },
  { index: 5, label: 'V' },
  { index: 6, label: 'S' },
  { index: 0, label: 'D' },
]

function statusIcon(status: Challenge['status']): string {
  return status === 'success' ? '✅ ' : status === 'failed' ? '❌ ' : ''
}

function duration(c: Challenge): string | undefined {
  if (!c.start_time || !c.end_time) return undefined
  const [sh, sm] = c.start_time.split(':').map(Number)
  const [eh, em] = c.end_time.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return undefined
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function dtstart(c: Challenge): string {
  return c.start_time ? `${c.due_date}T${c.start_time}` : (c.due_date as string)
}

function toEvent(c: Challenge): EventInput {
  const base: EventInput = {
    id: c.id,
    title: `${statusIcon(c.status)}${c.title}`,
    backgroundColor: STATUS_COLOR[c.status],
    borderColor: STATUS_COLOR[c.status],
  }

  if (c.recurrence === 'weekly' && c.recur_weekdays?.length) {
    return {
      ...base,
      rrule: {
        freq: 'weekly',
        byweekday: c.recur_weekdays.map((d) => WD_CODES[d]),
        dtstart: dtstart(c),
      },
      duration: duration(c),
    }
  }
  if (c.recurrence === 'monthly' && c.due_date) {
    return {
      ...base,
      rrule: {
        freq: 'monthly',
        bymonthday: new Date(c.due_date).getUTCDate(),
        dtstart: dtstart(c),
      },
      duration: duration(c),
    }
  }
  if (c.start_time) {
    return {
      ...base,
      start: `${c.due_date}T${c.start_time}`,
      end: c.end_time ? `${c.due_date}T${c.end_time}` : undefined,
    }
  }
  return { ...base, start: c.due_date ?? undefined, allDay: true }
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
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [recurrence, setRecurrence] = useState<'' | Recurrence>('')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const events = useMemo(
    () =>
      challenges
        .filter((c) => c.assigned_to === me && c.due_date)
        .map(toEvent),
    [challenges, me],
  )

  function openForm(dateStr: string) {
    setSelectedDate(dateStr)
    setTitle('')
    setAllDay(true)
    setRecurrence('')
    setWeekdays([new Date(dateStr).getDay()])
  }

  function toggleWeekday(index: number) {
    setWeekdays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index],
    )
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!selectedDate) return
    if (recurrence === 'weekly' && weekdays.length === 0) {
      toast.error('Choisis au moins un jour')
      return
    }
    setSaving(true)
    try {
      await createChallenge({
        projectId,
        assignedTo: me,
        title: title.trim(),
        axis,
        dueDate: selectedDate,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        recurrence: recurrence || null,
        recurWeekdays: recurrence === 'weekly' ? weekdays : null,
      })
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
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        locale="fr"
        firstDay={1}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        buttonText={{
          today: "Auj.",
          month: 'Mois',
          week: 'Semaine',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        events={events}
        dateClick={(arg) => openForm(arg.dateStr.slice(0, 10))}
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

          <select
            value={axis}
            onChange={(e) => setAxis(e.target.value as ChallengeAxis)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            {Object.values(ChallengeAxis).map((a) => (
              <option key={a} value={a}>
                {CHALLENGE_AXIS_LABELS[a]}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            Toute la journée
          </label>

          {!allDay && (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1"
              />
              <span className="text-gray-400">→</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1"
              />
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-500">
              Récurrence
            </legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { value: '', label: 'Aucune' },
                { value: 'weekly', label: 'Chaque semaine' },
                { value: 'monthly', label: 'Chaque mois' },
              ].map((o) => (
                <label key={o.value} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === o.value}
                    onChange={() => setRecurrence(o.value as '' | Recurrence)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          {recurrence === 'weekly' && (
            <div className="flex gap-1">
              {WEEKDAYS.map((d) => (
                <button
                  type="button"
                  key={d.index}
                  onClick={() => toggleWeekday(d.index)}
                  className={`h-8 w-8 rounded-full text-sm font-medium ${
                    weekdays.includes(d.index)
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 text-gray-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
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
