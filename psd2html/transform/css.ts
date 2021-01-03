// 转换css

import { isSingleColor, stream2Base64 } from "../common/utils";
import { PNode } from "../PNode";

/**
 * 转换css
 * @param node 节点
 * @param childStyles 子样式字符串
 */
export async function transformCss(node: PNode, childStyles: string): Promise<string> {
  try {
    if (node.type === 'group') return childStyles
    const backgroundStyles = await getBackground(node)
    // 拼接样式
    let styles = {
      ...getPosition(node),
      ...backgroundStyles
    }
    if (node.type === 'text') {
      styles = {
        ...styles,
        ...getTextStyles(node)
      }
    } else {
      styles = {
        ...styles,
        ...getSize(node),
      }
    }
    return `.${node.className}{${obj2Css(styles)}}${childStyles}`
  } catch (error) {
    console.error('转换失败', error)
  }
}
/**
 * 获取文本样式
 * @param node 节点
 */
function getTextStyles(node: PNode) {
  const position = node.position
  const textData = node.realNode.get('typeTool')
  // const text = node.textData
  // const css = textData.toCSS()
  const color = textData.colors()[0]
  const size = textData.sizes()[0]
  // const fonts = textData.fonts()
  // const skip = textData.skip()
  const leading = textData.styles().Leading[0]
  const alignment = textData.alignment()[0]
  const transform = textData.transform
  const styles = {
    color: `rgba(${color.join(',')})`,
    'font-size': size,
    'line-height': leading,
    'text-align': alignment,
    'transform-origin': `0 0`,
    'transform': `scale(${transform.xx}, ${transform.yy})`,
    'white-space': 'pre',
    'top': position.top - (leading - size) / 2
  }
  return styles
}
/**
 * 获取坐标
 * @param node 节点
 */
function getPosition(node: PNode) {
  const position = node.position
  // 样式
  const styles = {
    position: 'absolute',
    left: position.left,
    top: position.top
  }
  return styles
}
/**
 * 获取大小
 * @param node 节点
 */
function getSize(node: PNode) {
  const size = node.size
  // 返回
  return size
}
/**
 * 获取背景
 * @param node 节点
 */
async function getBackground(node: PNode) {
  let png: Record<string, any> = {}
  try {
    // 流数据
    png = node.realNode.toPng && node.realNode.toPng() || {}
  } catch (error) {
    // console.log('转换图片失败', error)
    png = {}
  }
  // 层级样式
  const layerStyles = node.layerStyles
  // 像素数据
  const pixelData: number[] = png.data
  // 样式对象
  const styles: Record<string, any> = {}
  // 判断是否是组或者根
  const isGroupOrRoot: boolean = !!node.type.match(/group|root/)
  // console.log(layerStyles, isGroupOrRoot)
  // 判断是否是单一颜色,并且不是根
  if (isSingleColor(pixelData) && !isGroupOrRoot) {
    const color = pixelData.slice(0, 4)
    styles['background-color'] = `rgba(${color.join(',')})`
  } else if (layerStyles && layerStyles.SoFi) {
    const SoFi = layerStyles.SoFi
    const color = SoFi['Clr ']
    // 判断是否开启
    if (SoFi.enab) {
      styles['background-color'] = `rgb(${color['Rd  ']}, ${color['Grn ']}, ${color['Bl  ']})`
    }
  } else if (!isGroupOrRoot && node.type !== 'text') {
    try {
      const base64 = await stream2Base64(png.pack())
      styles['background'] = `url(data:image/png;base64,${base64}) no-repeat top center / 100% 100%`
    } catch (error) {
      console.error('background处理失败')
    }
  }
  return styles
}
/**
 * 获取文字样式
 * @param node 节点
 */
function getFontStyles(node: PNode) {
  
}
/**
 * 对象转css
 * @param obj 对象
 */
function obj2Css(obj: Record<string, any>): string {
  let styles = ''
  // 遍历
  for (const key in obj) {
    let value: string | number | any[] = obj[key]
    // 判断是否为数组
    if (Array.isArray(value)) {
      let temp = []
      value.forEach(item => {
        if (typeof value === 'number') temp.push(`${item}px`)
      })
      value = temp.join(' ')
      // 判断是否为number
    } else if (typeof value === 'number') value = `${value}px`
    // 拼接
    if (!value) continue
    styles += `${key}: ${value};`
  }
  // 返回
  return styles
}