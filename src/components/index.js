// 视图类组件
export { default as StatCards } from './StatCards.vue'
export { default as TableView } from './TableView.vue'
export { default as CardsView } from './CardsView.vue'

// 弹窗与抽屉类组件
export { default as ConfigModal } from './ConfigModal.vue'
export { default as DetailDrawer } from './DetailDrawer.vue'
export { default as GroupModal } from './GroupModal.vue'
export { default as TaskModal } from './TaskModal.vue'
export { default as ImportConfigModal } from './ImportConfigModal.vue'
export { default as BatchAssignModal } from './BatchAssignModal.vue'
export { default as InspectionModal } from './InspectionModal.vue'

//封装bubble调用
import { h, render } from 'vue'
import MessageBubbleComponent from './MessageBubble.vue'

let vnode = null
let container = null

const message = (content, type = 'info', duration = 3000) => {
  if (typeof document === 'undefined') return

  if (!container) {
    container = document.createElement('div')
    vnode = h(MessageBubbleComponent)
    render(vnode, container)
    document.body.appendChild(container)
  }

  // 调用 add 并获取销毁函数
  return vnode.component.exposed.add({
    content,
    type,
    duration,
  })
}

// 快捷调用
message.success = (content, duration) => message(content, 'success', duration)
message.info    = (content, duration) => message(content, 'info', duration)
message.warning = (content, duration) => message(content, 'warning', duration)
message.error   = (content, duration) => message(content, 'error', duration)
message.loading = (content, duration = 0) => message(content, 'loading', duration)

export default message;
