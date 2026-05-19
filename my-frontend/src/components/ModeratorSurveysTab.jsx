import { useState, useEffect, useCallback } from 'react'
import {
  apiModeratorGetSurveys,
  apiModeratorCreateSurvey,
  apiModeratorUpdateSurvey,
  apiModeratorDeleteSurvey,
} from '../api/moderatorApi'

const EMPTY = {
  question: '',
  survey_type: 'SINGLE',
  priority: 0,
  is_active: true,
  options: [{ text: '' }, { text: '' }],
}

const box = { background: 'var(--bg-secondary,#1b1b2f)', border: '1px solid var(--border-color,#333)', borderRadius: 10, padding: 16, marginBottom: 14 }
const inp = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color,#444)', background: 'var(--bg-primary,#12121f)', color: 'inherit', marginBottom: 8 }
const btn = { padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }

export default function ModeratorSurveysTab({ token }) {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiModeratorGetSurveys(token)
      .then(d => setSurveys(Array.isArray(d) ? d : []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm(EMPTY); setEditId(null); setErr('') }

  const setOpt = (i, patch) =>
    setForm(f => ({ ...f, options: f.options.map((o, idx) => idx === i ? { ...o, ...patch } : o) }))
  const addOpt = () => setForm(f => ({ ...f, options: [...f.options, { text: '' }] }))
  const delOpt = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))

  const submit = async () => {
    setErr('')
    const opts = form.options.map(o => ({ text: o.text.trim() })).filter(o => o.text)
    if (!form.question.trim()) return setErr('Введите вопрос.')
    if (opts.length < 2) return setErr('Нужно минимум 2 варианта ответа.')

    const payload = {
      question: form.question.trim(),
      survey_type: form.survey_type,
      priority: Number(form.priority) || 0,
      is_active: !!form.is_active,
      options: opts,
    }
    setSaving(true)
    try {
      if (editId) await apiModeratorUpdateSurvey(token, editId, payload)
      else await apiModeratorCreateSurvey(token, payload)
      resetForm()
      load()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const startEdit = (s) => {
    setEditId(s.id)
    setForm({
      question: s.question,
      survey_type: s.survey_type,
      priority: s.priority,
      is_active: s.is_active,
      options: s.options.map(o => ({ text: o.text })),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changePriority = async (s, delta) => {
    try {
      await apiModeratorUpdateSurvey(token, s.id, { priority: Math.max(0, s.priority + delta) })
      load()
    } catch (e) { setErr(e.message) }
  }

  const toggleActive = async (s) => {
    try { await apiModeratorUpdateSurvey(token, s.id, { is_active: !s.is_active }); load() }
    catch (e) { setErr(e.message) }
  }

  const remove = async (s) => {
    if (!window.confirm('Удалить опросник?')) return
    try { await apiModeratorDeleteSurvey(token, s.id); load() }
    catch (e) { setErr(e.message) }
  }

  return (
    <div>
      {err && <div style={{ ...box, borderColor: '#e53935', color: '#e53935' }}>{err}</div>}

      {/* Create / edit form */}
      <div style={box}>
        <h3 style={{ marginBottom: 12 }}>{editId ? `Редактирование опроса #${editId}` : 'Новый опрос'}</h3>
        <textarea
          style={{ ...inp, minHeight: 60 }}
          placeholder="Вопрос"
          value={form.question}
          onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <select
            style={{ ...inp, width: 'auto', marginBottom: 0 }}
            value={form.survey_type}
            onChange={e => setForm(f => ({ ...f, survey_type: e.target.value }))}
          >
            <option value="SINGLE">Один выбор</option>
            <option value="MULTIPLE">Множественный выбор</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Приоритет:
            <input
              type="number" min="0"
              style={{ ...inp, width: 80, marginBottom: 0 }}
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            />
            Активен
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          {form.options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                style={{ ...inp, marginBottom: 0, flex: 1 }}
                placeholder={`Вариант ${i + 1}`}
                value={o.text}
                onChange={e => setOpt(i, { text: e.target.value })}
              />
              <button
                style={{ ...btn, background: '#7a2222', color: '#fff' }}
                onClick={() => delOpt(i)}
                disabled={form.options.length <= 2}
              >✕</button>
            </div>
          ))}
          <button style={{ ...btn, background: 'var(--border-color,#444)', color: 'inherit' }} onClick={addOpt}>
            + вариант
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btn, background: '#2e7d32', color: '#fff' }} onClick={submit} disabled={saving}>
            {saving ? '…' : editId ? 'Сохранить' : 'Создать'}
          </button>
          {editId && (
            <button style={{ ...btn, background: 'var(--border-color,#444)', color: 'inherit' }} onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? <p>Загрузка…</p> : surveys.length === 0 ? <p>Опросов пока нет.</p> : (
        surveys.map(s => (
          <div key={s.id} style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <strong style={{ flex: 1 }}>{s.question}</strong>
              <span style={{ opacity: 0.7, fontSize: 12 }}>
                {s.survey_type === 'SINGLE' ? 'Один выбор' : 'Мультивыбор'} · ответов: {s.responses_count}
              </span>
            </div>
            <ul style={{ margin: '8px 0', paddingLeft: 18 }}>
              {s.options.map(o => (
                <li key={o.id}>{o.text}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13 }}>Приоритет: <b>{s.priority}</b></span>
              <button style={{ ...btn, background: 'var(--border-color,#444)', color: 'inherit' }} onClick={() => changePriority(s, +1)}>▲</button>
              <button style={{ ...btn, background: 'var(--border-color,#444)', color: 'inherit' }} onClick={() => changePriority(s, -1)}>▼</button>
              <button style={{ ...btn, background: s.is_active ? '#555' : '#2e7d32', color: '#fff' }} onClick={() => toggleActive(s)}>
                {s.is_active ? 'Деактивировать' : 'Активировать'}
              </button>
              <button style={{ ...btn, background: '#1565c0', color: '#fff' }} onClick={() => startEdit(s)}>Редактировать</button>
              <button style={{ ...btn, background: '#7a2222', color: '#fff' }} onClick={() => remove(s)}>Удалить</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
