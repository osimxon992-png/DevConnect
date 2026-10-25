import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

// Chrome fires beforeinstallprompt once, often before React mounts, so catch it at module load.
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((f) => f())
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify() })
window.addEventListener('appinstalled', () => { deferred = null; notify() })

const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone

// Hidden once installed; without a native prompt (iOS, Firefox, criteria not met yet) it shows manual steps.
export default function InstallButton({ className = 'btn', children = <><Download size={18} /> Install app</> }) {
  const [, rerender] = useState(0)
  useEffect(() => {
    const f = () => rerender((n) => n + 1)
    listeners.add(f)
    return () => listeners.delete(f)
  }, [])
  if (installed) return null

  const install = async () => {
    if (!deferred) {
      alert(/iPhone|iPad/.test(navigator.userAgent)
        ? "Safari: Share tugmasi → \"Add to Home Screen\""
        : "Chrome: ⋮ menyu → \"Install app\" yoki \"Bosh ekranga qo'shish\"")
      return
    }
    deferred.prompt()
    await deferred.userChoice
    deferred = null
    notify()
  }
  return <button type="button" className={className} onClick={install} aria-label="Install app" title="Install app">{children}</button>
}
