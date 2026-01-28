// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

import * as fastboot from "../dist/fastboot.mjs";

// 全局设备实例 + 状态元素
let device = null;
const statusField = document.querySelector(".status-field");
const resultField = document.querySelector(".result-field");


// 初始化：设置基础配置
fastboot.setDebugLevel(1); // 降低日志级别，减少干扰


// 1. 连接设备
document.querySelector(".connect-button").addEventListener("click", async () => {
  statusField.textContent = "正在连接设备...";
  try {
    device = new fastboot.FastbootDevice();
    await device.connect();
    // 连接成功后自动获取设备信息
    const [product, serial] = await Promise.all([
      device.getVariable("product"),
      device.getVariable("serialno")
    ]);
    statusField.textContent = `已连接：${product}（SN：${serial}）`;
    resultField.textContent = "设备连接成功！";

    document.querySelector(".unlock-bl-button").disabled = false;
    document.querySelector(".lock-bl-button").disabled = false;
  } catch (err) {
    statusField.textContent = `连接失败：${err.message}`;
    device = null;
    // 连接失败
    document.querySelector(".unlock-bl-button").disabled = true;
    document.querySelector(".lock-bl-button").disabled = true;
  }
});


// 2. 解锁BL
document.querySelector(".unlock-bl-button").addEventListener("click", async () => {
  if (!device) return statusField.textContent = "请先连接设备！";
  statusField.textContent = "正在解锁BL...请在设备上确认操作！";
  try {
    const result = await device.runCommand("flashing unlock");
    statusField.textContent = "BL解锁指令已发送，设备将自动重启完成解锁！";
    resultField.textContent = `解锁结果：\n${result.text}`;
  } catch (err) {
    statusField.textContent = `BL解锁失败：${err.message}`;
  }
});


// 3. 上锁BL
document.querySelector(".lock-bl-button").addEventListener("click", async () => {
  if (!device) return statusField.textContent = "请先连接设备！";
  statusField.textContent = "正在上锁BL...请在设备上确认操作！";
  try {
    const result = await device.runCommand("flashing lock");
    statusField.textContent = "BL上锁指令已发送，设备将自动重启完成上锁！";
    resultField.textContent = `上锁结果：\n${result.text}`;
  } catch (err) {
    statusField.textContent = `BL上锁失败：${err.message}`;
  }
});


// 4. 发送Fastboot命令
document.querySelector(".command-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!device) return statusField.textContent = "请先连接设备！";

  const cmd = document.querySelector(".command-input").value.trim();
  if (!cmd) return resultField.textContent = "请输入Fastboot命令！";

  resultField.textContent = `执行命令：${cmd}...`;
  try {
    const res = await device.runCommand(cmd);
    resultField.textContent = `命令结果：\n${res.text}`;
  } catch (err) {
    resultField.textContent = `命令执行失败：${err.message}`;
  }
  document.querySelector(".command-input").value = ""; // 清空输入框
});


// 5. 刷写分区功能
document.querySelector(".flash-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!device) return statusField.textContent = "请先连接设备！";

  const file = document.querySelector(".flash-file").files[0];
  const partition = document.querySelector(".flash-partition").value.trim();
  if (!file) return resultField.textContent = "请选择要刷写的镜像文件！";
  if (!partition) return resultField.textContent = "请输入目标分区名（例如：boot）！";

  statusField.textContent = `正在刷写分区 ${partition}（文件：${file.name}）...`;
  resultField.textContent = "刷写中，请等待完成...";
  try {
    await device.flashBlob(partition, file, (progress) => {
      resultField.textContent = `刷写进度：${Math.round(progress * 100)}%`;
    });
    statusField.textContent = `分区 ${partition} 刷写完成！`;
    resultField.textContent = `成功刷写镜像到 ${partition} 分区`;
  } catch (err) {
    statusField.textContent = `刷写失败：${err.message}`;
  }
  // 清空选择
  document.querySelector(".flash-file").value = "";
  document.querySelector(".flash-partition").value = "";
});


// 6. 临时启动镜像功能
document.querySelector(".boot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!device) return statusField.textContent = "请先连接设备！";

  const file = document.querySelector(".boot-file").files[0];
  if (!file) return resultField.textContent = "请选择要临时启动的镜像文件！";

  statusField.textContent = `正在临时启动镜像：${file.name}...`;
  resultField.textContent = "启动指令发送中，请等待设备重启...";
  try {
    await device.bootBlob(file);
    statusField.textContent = `临时启动指令已发送，设备将重启并启动该镜像！`;
  } catch (err) {
    statusField.textContent = `临时启动失败：${err.message}`;
  }
  document.querySelector(".boot-file").value = ""; // 清空文件选择
});


// 隐藏不需要的工厂镜像功能（若有）
const factoryElements = [
  ".factory-form",
  ".download-zip-button",
  ".flash-zip-button",
  ".factory-status-field",
  ".factory-progress-bar",
  ".reconnect-button",
  ".factory-flash-log"
];
factoryElements.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) el.style.display = "none";
});

// @license-end