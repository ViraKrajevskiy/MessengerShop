import { useState, useEffect, useCallback } from 'react'
import { apiGetSurveys, apiRespondSurvey } from '../api/profileApi'

const card = { background: 'var(--bg-secondary,#1b1b2f)', border: '1px solid var(--border-color,#333)', borderRadius: 12, padding: 18, marginBottom: 16 }
const btn = { padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, background: '#2e7d32', color: '#fff' }

function SurveyCard({ survey, getAccessToken, onAnswered }) {
  const multi = survey.survey_type === 'MULTIPLE'
  const [picked, setPicked] = useState([])
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const result = survey.answered ? survey.my_result : null

  const toggle = (id) => {
    setErr('')
    setPicked(prev =>
      multi
        ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
        : [id])
  }

  const submit = async () => {
    if (picked.length === 0) { setErr('Выберите вариант ответа.'); return }
    setSending(true); setErr('')
    try {
      const token = await getAccessToken()
      const res = await apiRespondSurvey(token, survey.id, picked)
      onAnswered(survey.id, {
        selected: picked,
        is_correct: res.is_correct,
        correct_option_ids: res.correct_option_ids,
      })
    } catch (e) { setErr(e.message) }
    finally { setSending(false) }
  }

  return (
    <div style={card}>
      <h3 style={{ marginBottom: 4 }}>{survey.question}</h3>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 12 }}>
        {multi ? 'Можно выбрать несколько' : 'Выберите один вариант'}
      </div>

      {survey.options.map(o => {
        const chosen = result ? result.selected.includes(o.id) : picked.includes(o.id)
        const isRight = result?.correct_option_ids?.includes(o.id)
        let bg = 'transparent'
        if (result) {
          if (isRight) bg = 'rgba(76,175,80,0.18)'
          else if (chosen) bg = 'rgba(229,57,53,0.18)'
        } else if (chosen) bg = 'rgba(33,150,243,0.15)'
        return (
          <label
            key={o.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: bg, cursor: result ? 'default' : 'pointer', marginBottom: 6 }}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={`survey-${survey.id}`}
              disabled={!!result}
              checked={chosen}
              onChange={() => toggle(o.id)}
            />
            <span>{o.text}</span>
            {result && isRight && <span style={{ marginLeft: 'auto', color: '#4caf50' }}>верный</span>}
          </label>
        )
      })}

      {err && <div style={{ color: '#e53935', marginTop: 8 }}>{err}</div>}

      {result ? (
        <div style={{ marginTop: 12, fontWeight: 600, color: result.is_correct ? '#4caf50' : '#e53935' }}>
          {result.is_correct ? '✓ Ответ верный' : '✗ Ответ неверный'}
        </div>
      ) : (
        <button style={{ ...btn, marginTop: 12, opacity: sending ? 0.6 : 1 }} onClick={submit} disabled={sending}>
          {sending ? 'Отправка…' : 'Ответить'}
        </button>
      )}
    </div>
  )
}

export default function BusinessSurveySection({ getAccessToken }) {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const token = await getAccessToken()
      const data = await apiGetSurveys(token)
      setSurveys(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [getAccessToken])

  useEffect(() => { load() }, [load])

  const onAnswered = (id, myResult) =>
    setSurveys(prev => prev.map(s =>
      s.id === id ? { ...s, answered: true, my_result: myResult } : s))

  if (loading) return <p style={{ padding: 16 }}>Загрузка опросов…</p>
  if (err) return <p style={{ padding: 16, color: '#e53935' }}>{err}</p>
  if (surveys.length === 0) return <p style={{ padding: 16, opacity: 0.7 }}>Опросов пока нет.</p>

  return (
    <div>
      {surveys.map(s => (
        <SurveyCard key={s.id} survey={s} getAccessToken={getAccessToken} onAnswered={onAnswered} />
      ))}
    </div>
  )
}
