# 🎵 Music Player Tauri

一个基于 Tauri + React + TypeScript 构建的现代化桌面音乐播放器，以精美的进度条组件库为特色。

## ✨ 项目特色

### 🎨 16种精美进度条风格

本项目的核心亮点是包含了**16种不同风格的进度条组件**，涵盖了从简约到复杂、从现代到复古的各种设计风格：

1. **现代渐变风格** - 渐变色彩、发光效果、动态交互 ⭐ *推荐*
2. **极简线条风格** - 简洁优雅、细线条、悬停显示滑块
3. **霓虹发光风格** - 赛博朋克风格、霓虹发光、动态光效
4. **玻璃拟态风格** - 毛玻璃效果、半透明、高光反射
5. **波浪动画风格** - 流动波浪、动态效果、海洋主题
6. **脉冲动画风格** - 心跳脉冲、呼吸效果、生命力感
7. **多彩渐变风格** - 彩虹渐变、星光效果、梦幻色彩
8. **分段式风格** - 分段显示、精确控制、游戏风格
9. **圆形进度条** - 圆形设计、空间节省、仪表盘风格
10. **液体波动风格** - 液体效果、气泡动画、真实物理
11. **拟物化风格** - 真实材质、立体效果、怀旧感
12. **粒子效果风格** - 粒子动画、星光轨迹、魔法效果
13. **数字风格** - 科技感、字符动画、黑客风格
14. **复古风格** - 怀旧设计、复古色彩、蒸汽朋克
15. **电路板霓虹风格** - 电路板纹理、数据流动画、硬核科技感 🆕
16. **交互式霓虹风格** - 智能交互、悬停放大、拖拽支持 🆕

### 🎯 适用场景

- **现代应用**：方案1、4、5、16
- **游戏界面**：方案3、6、8、12、15
- **音乐播放器**：方案7、9、10、16
- **专业软件**：方案2、11、13
- **创意项目**：方案14、12、7
- **科技产品**：方案15、3、13
- **交互重点应用**：方案16、1

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6.0
- **桌面应用**: Tauri 2.0 (Rust)
- **样式**: Tailwind CSS 4.1 + CSS3 动画
- **状态管理**: React Hooks + Context API
- **路由**: React Router DOM 7.6
- **动画**: Framer Motion 12.17
- **图标**: Lucide React
- **开发工具**: ESLint + Prettier

## 🚀 功能特点

### 🎛️ 核心功能
- **音频播放** - 支持多种音频格式
- **视频播放** - 集成视频播放功能
- **播放列表管理** - 创建、编辑、管理播放列表
- **播放模式** - 顺序播放、随机播放、单曲循环
- **音频可视化** - 实时音频频谱显示
- **主题切换** - 明暗主题支持

### 🎨 交互体验
- **实时调节控制台** - 可视化调节所有进度条
- **鼠标交互支持** - 点击、拖拽、悬停效果
- **键盘快捷键** - 便捷的操作体验
- **响应式设计** - 适配不同屏幕尺寸
- **通知系统** - 播放状态通知

### 🎨 视觉效果
- **动态动画** - 多种CSS3和自定义动画效果
- **发光特效** - 霓虹、粒子、波浪等特殊效果
- **颜色主题** - 支持多种颜色配置
- **材质质感** - 玻璃、金属、木材等拟物效果

### ⚡ 性能优化
- **轻量级组件** - 高效的React组件设计
- **硬件加速** - CSS3 GPU加速动画
- **内存优化** - 合理的状态管理和生命周期
- **快速启动** - Tauri原生性能

## 📦 安装与运行

### 环境要求
- Node.js 18+
- Rust 1.70+
- pnpm/npm/yarn

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/music-play-tauri.git
cd music-play-tauri

# 安装依赖
npm install
# 或者使用 pnpm
pnpm install

# 启动开发服务器
npm run tauri dev
# 或者使用 pnpm
pnpm tauri dev
```

### 构建应用

```bash
# 构建生产版本
npm run tauri build
# 或者使用 pnpm
pnpm tauri build
```

## 🎯 推荐IDE设置

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 📁 项目结构

```
music-play-tauri/
├── src/
│   ├── components/
│   │   ├── progress-bars/                    # 🎨 进度条组件库
│   │   │   ├── ProgressBar.tsx              # 方案1: 现代渐变风格
│   │   │   ├── MinimalProgressBar.tsx       # 方案2: 极简线条风格
│   │   │   ├── NeonProgressBar.tsx          # 方案3: 霓虹发光风格
│   │   │   ├── GlassProgressBar.tsx         # 方案4: 玻璃拟态风格
│   │   │   ├── WaveProgressBar.tsx          # 方案5: 波浪动画风格
│   │   │   ├── PulseProgressBar.tsx         # 方案6: 脉冲动画风格
│   │   │   ├── GradientProgressBar.tsx      # 方案7: 多彩渐变风格
│   │   │   ├── SegmentedProgressBar.tsx     # 方案8: 分段式风格
│   │   │   ├── CircularProgressBar.tsx      # 方案9: 圆形进度条
│   │   │   ├── LiquidProgressBar.tsx        # 方案10: 液体波动风格
│   │   │   ├── SkeuomorphicProgressBar.tsx  # 方案11: 拟物化风格
│   │   │   ├── ParticleProgressBar.tsx      # 方案12: 粒子效果风格
│   │   │   ├── DigitalProgressBar.tsx       # 方案13: 数字风格
│   │   │   ├── VintageProgressBar.tsx       # 方案14: 复古风格
│   │   │   ├── Neon2ProgressBar.tsx         # 方案15: 电路板霓虹风格
│   │   │   ├── Neon3ProgressBar.tsx         # 方案16: 交互式霓虹风格
│   │   │   ├── ProgressBarDemo.tsx          # 展示页面
│   │   │   ├── ProgressBarDemo.css          # 样式文件
│   │   │   ├── index.ts                     # 统一导出
│   │   │   └── README.md                    # 组件库文档
│   │   ├── AudioVisualizer.tsx              # 音频可视化
│   │   ├── PlaybackControls.tsx             # 播放控制
│   │   ├── VideoPlayer.tsx                  # 视频播放器
│   │   ├── LibraryView.tsx                  # 音乐库视图
│   │   ├── PlaylistView.tsx                 # 播放列表视图
│   │   ├── SettingsView.tsx                 # 设置页面
│   │   ├── ThemeToggle.tsx                  # 主题切换
│   │   └── ...                              # 其他组件
│   ├── contexts/                            # React Context
│   ├── hooks/                               # 自定义 Hooks
│   ├── types/                               # TypeScript 类型定义
│   ├── utils/                               # 工具函数
│   └── assets/                              # 静态资源
├── src-tauri/                               # Tauri 后端 (Rust)
├── public/                                  # 公共资源
├── package.json                             # 项目配置
├── tailwind.config.js                      # Tailwind 配置
├── vite.config.ts                          # Vite 配置
└── README.md                                # 项目文档
```

## 🎨 进度条组件库使用

### 快速开始

```tsx
// 单个组件导入
import { NeonProgressBar } from './components/progress-bars/NeonProgressBar';

// 批量导入
import { 
  ProgressBar, 
  NeonProgressBar, 
  CircularProgressBar 
} from './components/progress-bars';

// 完整演示
import { ProgressBarDemo } from './components/progress-bars';

function App() {
  return (
    <div>
      {/* 使用单个组件 */}
      <NeonProgressBar
        value={50}
        max={100}
        onChange={(value) => console.log(value)}
        color="cyan"
      />
      
      {/* 展示所有16种风格 */}
      <ProgressBarDemo />
    </div>
  );
}
```

### 通用属性

```tsx
interface ProgressBarProps {
  value: number;                    // 当前值
  max: number;                      // 最大值
  onChange: (value: number) => void; // 值变化回调
  className?: string;               // 自定义CSS类名
  color?: string;                   // 颜色主题
  height?: 'thin' | 'medium' | 'thick'; // 高度
}
```

## 🎨 设计理念

这个项目的设计理念是**"一个组件，无限可能"**。通过精心设计的16种进度条风格，展示了：

- **多样性** - 从简约到华丽，满足不同审美需求
- **实用性** - 每种风格都有其最佳适用场景
- **交互性** - 注重用户体验和操作反馈
- **扩展性** - 模块化设计，易于定制和扩展
- **组织性** - 清晰的文件结构，便于维护和开发

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循 TypeScript 严格模式
- 使用 ESLint 和 Prettier 格式化代码
- 组件放置在对应的文件夹中
- 添加适当的类型定义和注释

## 📄 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🌟 致谢

感谢所有为这个项目贡献代码和创意的开发者们！

---

⭐ 如果这个项目对您有帮助，请给它一个星标！

## 📸 预览截图

> 注：可以在这里添加应用程序的截图展示

## 🔗 相关链接

- [Tauri 官方文档](https://tauri.app/)
- [React 官方文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)