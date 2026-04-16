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

//封装命令式函数
import { h, render } from 'vue'
import MessageBubbleComponent from './MessageBubble.vue'

let vnode = null
let container = null

const message = (content, type = 'info') => {
  // 1. 如果还没有容器，先创建一个挂载点
  if (!container) {
    container = document.createElement('div')
    vnode = h(MessageBubbleComponent)
    render(vnode, container)
    document.body.appendChild(container)
  }

  // 2. 调用组件内部暴露的 add 方法
  // vnode.component.exposed 对应上面 defineExpose 暴露出的方法
  vnode.component.exposed.add({
    content,
    type,
    duration: 3000,
  })
}

// 快捷调用
message.success = (content) => message(content, 'success')
message.error = (content) => message(content, 'error')

export default message;

