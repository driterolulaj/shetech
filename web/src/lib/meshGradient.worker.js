// Runs the mesh gradient off the page's main thread (see createMeshGradient).
import { createRenderer } from './meshRenderer'

let renderer = null

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    renderer = createRenderer(data.canvas, data.options)
    if (!renderer) self.postMessage('failed')
    return
  }
  if (!renderer) return
  if (data.type === 'resize') renderer.resize(data.width, data.height)
  else if (data.type === 'colors') renderer.setColors(data.colors)
  else if (data.type === 'draw') renderer.draw()
  else if (data.type === 'start') renderer.start()
  else if (data.type === 'stop') renderer.stop()
}
