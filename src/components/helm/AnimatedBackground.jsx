import { useEffect, useRef } from 'react'

export default function AnimatedBackground({ active = true, intensity = 1, theme = 'dark' }) {
  const canvasRef  = useRef(null)
  const mouseRef   = useRef({ x: -9999, y: -9999, down: false })
  const themeRef   = useRef(theme)
  const intentRef  = useRef(intensity)

  useEffect(() => { themeRef.current  = theme    }, [theme])
  useEffect(() => { intentRef.current = intensity }, [intensity])

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let raf

    const isMobile      = window.innerWidth < 768
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const hw            = navigator.hardwareConcurrency || 4
    const dpr           = Math.min(window.devicePixelRatio || 1, 1.8)
    const perfFactor    = isMobile ? 0.55 : hw <= 4 ? 0.75 : 1
    const targetFps     = reducedMotion ? 18 : isMobile ? 30 : 48
    const frameInterval = 1000 / targetFps

    let W = 0, H = 0
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const N   = Math.round((isMobile ? 38 : 72) * Math.min(1.2, perfFactor))
    const pts = Array.from({ length: N }, () => ({
      x    : Math.random() * window.innerWidth,
      y    : Math.random() * window.innerHeight,
      vx   : (Math.random() - 0.5) * 0.42,
      vy   : (Math.random() - 0.5) * 0.42,
      r    : Math.random() * 1.4 + 0.55,
      pulse: Math.random() * Math.PI * 2,
    }))

    let sparks     = []
    let sparkTimer = 0
    const bursts   = []

    const onMove  = (e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY }
    const onDown  = (e) => {
      mouseRef.current.x    = e.clientX
      mouseRef.current.y    = e.clientY
      mouseRef.current.down = true
      bursts.push({ x: e.clientX, y: e.clientY, born: performance.now(), size: 1 + Math.random() * 0.8 })
    }
    const onUp    = () => { mouseRef.current.down = false }
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999, down: false } }

    const drawBurst = (b, now, dark) => {
      const age = now - b.born
      if (age > 700) return false
      const p  = age / 700
      const r  = 20 + p * 100 * b.size
      const a  = 0.5 * (1 - p)
      const g1 = dark ? `rgba(109,184,255,${a})`     : `rgba(37,99,235,${a})`
      const g2 = dark ? `rgba(45,212,191,${a * .9})` : `rgba(14,165,233,${a * .9})`
      ctx.beginPath(); ctx.strokeStyle = g1; ctx.lineWidth = 1.4
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.stroke()
      const spikes = isMobile ? 6 : 10
      for (let i = 0; i < spikes; i++) {
        const angle = (Math.PI * 2 * i / spikes) + p * 1.1
        const len   = 14 + 40 * (1 - p) * b.size
        ctx.strokeStyle = g2; ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(b.x + Math.cos(angle) * len, b.y + Math.sin(angle) * len)
        ctx.stroke()
      }
      return true
    }

    let lastFrame = 0

    const draw = (t) => {
      raf = requestAnimationFrame(draw)
      if (t - lastFrame < frameInterval) return
      lastFrame = t

      ctx.clearRect(0, 0, W, H)

      const dark   = themeRef.current !== 'light'
      const ef     = Math.max(0.5, intentRef.current * perfFactor)
      const { x: mx, y: my } = mouseRef.current

      const lineRGB    = dark ? '96,165,250'  : '29,78,216'
      const dotRGB     = dark ? '147,197,253' : '37,99,235'
      const mouseRGB   = dark ? '147,197,253' : '59,130,246'
      const sparkRGB   = dark ? '200,237,255' : '30,58,138'
      const lineAlpha  = dark ? 0.17 * ef : 0.07 * ef
      const dotAlpha   = dark ? 0.50      : 0.28
      const mouseAlpha = dark ? 0.30 * ef : 0.11 * ef
      const sparkAlpha = dark ? 0.60      : 0.28
      const connDist   = isMobile ? 100 : 130

      /* update + mouse attraction */
      for (const p of pts) {
        const dx = mx - p.x, dy = my - p.y
        const d  = Math.hypot(dx, dy)
        if (d < 200 && d > 1) {
          const f = 0.000075 * (200 - d) * ef
          p.vx += (dx / d) * f
          p.vy += (dy / d) * f
        }
        p.vx *= 0.990; p.vy *= 0.990
        p.x  += p.vx;  p.y  += p.vy
        p.pulse += 0.011
        if (p.x < -10)    p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10)    p.y = H + 10
        if (p.y > H + 10) p.y = -10
      }

      /* web lines */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d  = Math.hypot(dx, dy)
          if (d < connDist) {
            const a = (1 - d / connDist) * lineAlpha
            ctx.strokeStyle = `rgba(${lineRGB},${a})`
            ctx.lineWidth   = d < 55 ? 1.1 : 0.5
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      /* pulsing dots */
      ctx.shadowBlur  = isMobile ? 4 : 7
      ctx.shadowColor = dark ? 'rgba(107,177,255,0.38)' : 'rgba(59,130,246,0.22)'
      for (const p of pts) {
        const r = 1.1 + Math.sin(p.pulse + t * 0.0015) * 0.38
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dotRGB},${dotAlpha})`
        ctx.fill()
      }
      ctx.shadowBlur = 0

      /* mouse proximity lines */
      for (const p of pts) {
        const d = Math.hypot(mx - p.x, my - p.y)
        if (d < 165) {
          const a = (1 - d / 165) * mouseAlpha
          ctx.strokeStyle = `rgba(${mouseRGB},${a})`
          ctx.lineWidth   = 0.65
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mx, my)
          ctx.stroke()
        }
      }

      /* cursor glow */
      if (mx > 0 && mx < W) {
        const gAlpha = dark ? 0.12 : 0.06
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 88)
        grad.addColorStop(0,   `rgba(${mouseRGB},${gAlpha})`)
        grad.addColorStop(0.5, `rgba(${mouseRGB},${gAlpha * 0.4})`)
        grad.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mx, my, 88, 0, Math.PI * 2)
        ctx.fill()
      }

      /* electric sparks — faster when mouse is held */
      sparkTimer++
      const sparkRate = mouseRef.current.down ? 0.14 : 0.048
      if (sparkTimer > 45 && Math.random() < sparkRate * ef) {
        sparkTimer = 0
        const i = Math.floor(Math.random() * pts.length)
        const j = Math.floor(Math.random() * pts.length)
        if (i !== j) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
          if (d < 95 && d > 16) {
            sparks.push({
              x1: pts[i].x, y1: pts[i].y,
              x2: pts[j].x, y2: pts[j].y,
              life: 7 + Math.floor(Math.random() * 4),
              maxLife: 11,
            })
          }
        }
      }
      sparks = sparks.filter(s => s.life > 0)
      for (const s of sparks) {
        const a = (s.life / s.maxLife) * sparkAlpha
        ctx.strokeStyle = `rgba(${sparkRGB},${a})`
        ctx.lineWidth   = 0.9
        ctx.beginPath()
        ctx.moveTo(s.x1, s.y1)
        for (let k = 1; k < 6; k++) {
          const tt = k / 6
          ctx.lineTo(
            s.x1 + (s.x2 - s.x1) * tt + (Math.random() - 0.5) * 14,
            s.y1 + (s.y2 - s.y1) * tt + (Math.random() - 0.5) * 14
          )
        }
        ctx.lineTo(s.x2, s.y2)
        ctx.stroke()
        s.life--
      }

      /* click bursts */
      const now = performance.now()
      for (let i = bursts.length - 1; i >= 0; i--) {
        if (!drawBurst(bursts[i], now, dark)) bursts.splice(i, 1)
      }
    }

    raf = requestAnimationFrame(draw)

    window.addEventListener('resize',       resize,  { passive: true })
    window.addEventListener('pointermove',  onMove,  { passive: true })
    window.addEventListener('pointerdown',  onDown,  { passive: true })
    window.addEventListener('pointerup',    onUp,    { passive: true })
    window.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize',       resize)
      window.removeEventListener('pointermove',  onMove)
      window.removeEventListener('pointerdown',  onDown)
      window.removeEventListener('pointerup',    onUp)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="animated-electric-bg"
      aria-hidden="true"
      style={{ opacity: theme === 'light' ? 0.55 : 1 }}
    />
  )
}
