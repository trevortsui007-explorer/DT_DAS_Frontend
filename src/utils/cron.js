export function translateCron(cron) {
  if (!cron || cron === "null" || cron === "-" || cron.trim() === "") {
    return "未设置周期";
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return `周期: ${cron}`;
  }

// 统一处理为 6 位（秒可选）
  let [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts.length === 6
    ? parts
    : ["*", ...parts];

  const pad = (num) => num.toString().padStart(2, '0');

// ====================== 辅助解析函数 ======================

// 解析时间字段（支持 *、数字、范围、列表、步长）
  function parseField(field, unit) {
    if (field === "*") return `每${unit}`;
    if (field.includes("/")) {
      const [start, step] = field.split("/");
      if (start === "*") return `每隔 ${step} ${unit}`;
      return `${start}-${step} ${unit}执行`;
    }
    if (field.includes(",")) {
      return field.split(",").join("、") + ` ${unit}`;
    }
    if (field.includes("-")) {
      return `${field} ${unit}`;
    }
    return field + ` ${unit}`;
  }

// 星期映射
  const weekMap = {
    "0": "日", "7": "日",
    "1": "一", "2": "二", "3": "三",
    "4": "四", "5": "五", "6": "六"
  };

  function parseWeek(w) {
    if (w === "*") return "";
    if (w.includes("#")) {
      const [day, nth] = w.split("#");
      return `每月第 ${nth} 个星期${weekMap[day] || day}`;
    }
    if (w.endsWith("L")) {
      const day = w.replace("L", "");
      return `每月最后一个星期${weekMap[day] || day}`;
    }
    if (w.includes(",")) {
      return w.split(",").map(d => weekMap[d] || d).join("、");
    }
    return weekMap[w] || w;
  }

// ====================== 优先匹配常见场景 ======================

// 1. 每隔 X 分钟（最常见）
  if (hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*" &&
    minute.includes("/") && !minute.includes(",")) {
    const step = minute.split("/")[1];
    return `每隔 ${step} 分钟执行一次`;
  }

// 2. 每天固定时间
  if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    if (hour !== "*" && minute !== "*") {
      let timeStr = `${pad(hour)}:${pad(minute)}`;
      // 处理分钟列表或范围
      if (minute.includes(",") || minute.includes("-") || minute.includes("/")) {
        timeStr = parseField(minute, "分");
        return `每天 ${pad(hour)} 点 ${timeStr} 执行`;
      }
      return `每天 ${timeStr} 执行`;
    }
    if (hour === "*" && minute === "*") {
      return second === "*" ? "每秒执行一次" : "每分钟执行一次";
    }
  }

// 3. 每周固定星期
  if (dayOfWeek !== "*" && dayOfMonth === "*" && month === "*") {
    const weekDesc = parseWeek(dayOfWeek);
    let timeDesc = `${pad(hour)}:${pad(minute)}`;
    return `每周${weekDesc} ${timeDesc} 执行`;
  }

// 4. 每月固定日期
  if (dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
    let dayDesc = dayOfMonth;

    if (dayOfMonth === "L") dayDesc = "最后一天";
    else if (dayOfMonth === "LW") dayDesc = "最后一个工作日";
    else if (dayOfMonth.includes("W")) {
      const d = dayOfMonth.replace("W", "");
      dayDesc = `${d} 号最近的工作日`;
    }

    return `每月 ${dayDesc} ${pad(hour)}:${pad(minute)} 执行`;
  }

// 5. 每年固定月日（较少见）
  if (month !== "*" && dayOfMonth !== "*" && dayOfWeek === "*") {
    return `${month} 月 ${dayOfMonth} 号 ${pad(hour)}:${pad(minute)} 执行`;
  }

// 6. 每 X 秒（秒级任务）
  if (second !== "*" && minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    if (second.includes("/")) {
      return `每隔 ${second.split("/")[1]} 秒执行一次`;
    }
    return "每秒执行一次";
  }

// ====================== 兜底 ======================
// 对于更复杂的组合（如同时有日期和星期限制、多个特殊字符等），返回增强描述
  let desc = "周期: ";

  if (second !== "*" && second !== "0") desc += `秒:${second} `;
  desc += `分:${parseField(minute, '')} 时:${parseField(hour, '')} `;
  if (dayOfMonth !== "*") desc += `日:${dayOfMonth} `;
  if (month !== "*") desc += `月:${month} `;
  if (dayOfWeek !== "*") desc += `周:${parseWeek(dayOfWeek)}`;

  return desc.trim();
}
