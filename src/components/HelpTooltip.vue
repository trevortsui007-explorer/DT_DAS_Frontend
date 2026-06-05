<template>
  <span class="help-tooltip" tabindex="0" :aria-label="text">
    <span class="help-tooltip__icon">?</span>
    <span class="help-tooltip__bubble">{{ text }}</span>
  </span>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.help-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  vertical-align: middle;
  outline: none;
}

.help-tooltip__icon {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid #bfbfbf;
  color: #8c8c8c;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  cursor: help;
}

.help-tooltip__bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%) translateY(4px);
  min-width: 180px;
  padding: 7px 10px;
  border-radius: 6px;
  color: #fff;
  background: rgba(0, 0, 0, 0.78);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  z-index: 10;
}

.help-tooltip__bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.78);
}

.help-tooltip:hover .help-tooltip__icon,
.help-tooltip:focus .help-tooltip__icon {
  color: #52c41a;
  border-color: #52c41a;
  background: #f6ffed;
}

.help-tooltip:hover .help-tooltip__bubble,
.help-tooltip:focus .help-tooltip__bubble {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
