// 工具方法

/**
 * 判断是否是文本对象
 */
export function isTextLayer(layer) {
  return !!layer.get('typeTool')
}
/**
 * stream流转base64
 * @param stream 可读流
 */
export function stream2Base64(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const data: Buffer[] = []
    stream.on('data', (buf) => {
      // console.log(buf)
      data.push(buf)
    })
    stream.on('end', () => {
      const base64 = Buffer.concat(data).toString('base64')
      resolve(base64)
    })
    stream.on('error', (error) => {
      reject(error)
    })
  })
}
/**
 * 判断是否是单一颜色, 小于4为单色
 * @param pixelData 像素点数据
 */
export function isSingleColor(pixelData: number[]) {
  const data = new Set(pixelData)
  return data.size <= 4
}
/**
 * 获取旋转角度
 * @param transform 变换对象
 */
export function getTransformRotate(transform: any) {
  let rotation = Math.round(Math.atan(transform.xy / transform.xx) * (180 / Math.PI))
  if (transform.xx < 0) {
    rotation += 180
  } else if (rotation < 0) {
    rotation += 360
  }
  return rotation
}