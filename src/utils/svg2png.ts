export async function svg2png(blob: Blob): Promise<Blob> {
  const svgText = await blob.text()
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG load failed'))
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.width || 400
  canvas.height = img.height || 600
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png')
  )
}
