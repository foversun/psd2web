// 工具方法

import { PNode } from "../PNode"
import { PNG } from 'pngjs'
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
 * 找到裁剪容器
 * @param node 节点
 */
export function clippedBy(node: RealNode) {
  const _clippedBy = node.clippedBy()
  if (_clippedBy && _clippedBy !== node) return clippedBy(_clippedBy)
  return node
}
/**
 * 像素点转base64
 * @param pixelData 像素点数组
 * @param width 宽度
 * @param height 高度
 */
export async function pixedData2Base64(pixelData: number[], width: number, height: number) {
  try {
    const png = new PNG({
      filterType: 4,
      width,
      height
    })
    png.data = pixelData
    return await stream2Base64(png.pack())
  } catch (error) {
    throw error
  }
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
/**
 * 合并元素数组所有像素点
 * @param parent 父节点
 * @param childs 子节点数组
 */
export function mergeChildsPixelData(parent: PNode, childs: PNode[]) {
  let parentPixel = parent.realNode.layer.image.pixelData
  childs.forEach(child => {
    // 子级像素点
    const childPixel: number[] = child.realNode.layer.image.pixelData
    // 重新获取赋值
    parentPixel = mergePixelData(parent, child, parentPixel, childPixel)
  })
  return parentPixel
}
/**
 * 合并像素数据
 * @param parent 父节点
 * @param child 子节点
 * @param parentPixel 父像素点
 * @param childPixel 子像素点
 */
export function mergePixelData(parent: PNode, child: PNode, parentPixel: number[], childPixel: number[]) {
  // 父级像素点
  // const parentPixel: number[] = parent.realNode.layer.image.pixelData
  // 像素点长度
  const parentPixelLength: number = parentPixel.length
  // 获取大小
  let parentSize: ISize = parent.size
  // 获取坐标
  const parentPos: IPosition = parent.position
  // 子级像素点
  // const childPixel: number[] = child.realNode.layer.image.pixelData
  // 获取大小
  const childSize: ISize = child.size
  // 获取坐标
  const childPos: IPosition = child.position
  // 不同的坐标
  const diff = {
    x: childPos.left - parentPos.left,
    y: childPos.top - parentPos.top
  }
  // 结果像素数组
  let resultPixel = []
  for (let index = 0; index < parentPixelLength; index += 4) {
    // 透明度
    const opacity = parentPixel[index + 3]
    // 透明度不为0的话
    if (opacity !== 0) {
      // 当前位置
      const nowIndex = (index / 4) + 1
      // x的位置
      const x = nowIndex - Math.floor(nowIndex / parentSize.width) * parentSize.width
      // y轴位置
      const y = Math.ceil(nowIndex / parentSize.width)
      // 判断是否在重合区域内
      if ((x > diff.x && x <= diff.x + childSize.width) && (y > diff.y && y <= diff.y + childSize.height)) {
        // 计算差
        const diffX = x - diff.x - 1
        const diffY = y - diff.y - 1
        // 计算出最后的像素点索引位置
        const childIndex = (diffY * childSize.width + diffX) * 4
        // 获取透明度
        const childOpacity = childPixel[childIndex + 3]
        if (childOpacity !== 0) {
          // 获取最终结果
          resultPixel = resultPixel.concat(Array.from(childPixel.slice(childIndex, childIndex + 4)))
          continue
        }
      }
    }
    // 获取最终结果
    resultPixel = resultPixel.concat(Array.from(parentPixel.slice(index, index + 4)))
  }
  return new Uint8Array(resultPixel)
}