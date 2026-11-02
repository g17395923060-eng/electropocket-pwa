# 电工计算器 PWA（Windows 可准备，iPhone 可离线使用）

这是原生 Xcode 项目的网页应用版本。它无需 Mac 编译，可从 Windows 上传到 HTTPS 静态托管服务，然后通过 iPhone Safari 添加到主屏幕。首次打开需要联网加载并缓存文件；完成后，计算、识别和界面资源可离线使用。应用不调用第三方 API，也不上传输入内容。

## 功能

- 电阻串联、并联，支持 2–6 个阻值。
- V、I、R、P 任意两个参数求解其余参数。
- 电阻、恒流、恒功率三种模拟负载，附额定功率参考。
- 离线识别常见三位码、四位码和 R 小数码；例如 `510` → `51 Ω`。
- 常见元件封装尺寸参考。阻值丝印本身无法可靠推断封装，需按外形确认。
- PWA 缓存用于断网启动；页面、样式、脚本、图标全部为本地文件。

## 通过 Windows 准备和部署

可用 GitHub Pages 免费发布静态文件（GitHub Free 需要公开仓库，因此仓库代码和网页地址会公开；此项目不包含个人资料，计算输入只保存在设备本地）：

1. 登录 GitHub，新建一个仓库，例如 `electropocket-pwa`。
2. 把本文件夹中的**所有文件**上传到仓库根目录，确保 `index.html` 就在根目录，不要只上传外层文件夹。
3. 打开仓库 **Settings → Pages**；在 **Build and deployment** 里选 **Deploy from a branch**，选择 `main` 和 `/(root)` 后保存。GitHub 会显示一个 `https://...github.io/...` 网页地址。
4. 等页面发布后，在 iPhone 上用 **Safari** 打开该 HTTPS 地址一次，等待完全加载。
5. Safari 点“分享” → “添加到主屏幕”，打开“作为网页 App 打开”（若显示该选项），再点“添加”。
6. 确认应用已经打开过一次后，即可断网启动主屏幕图标继续计算。

不要只双击 `index.html`：iPhone 离线网页应用需要先从 HTTPS 地址打开，以便 Safari 缓存资源并注册 Service Worker。GitHub Pages 分支发布步骤见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

Apple 的 iPhone 指引：[在 Safari 中将网站添加到主屏幕](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-in-safari-iphea86e5236/ios)。PWA 的 Service Worker 需要安全上下文（通常为 HTTPS）；本地 `file://` 页面不能替代部署后的首次打开。

## 兼容说明

这是安装到主屏幕的网页 App，不是 App Store 原生 `.ipa`。对于个人计算和离线查码，两者提供相同的核心功能；但网页 App 不具备所有原生 iOS 能力。
