# 🎨 Progress Bar Components Library

一个包含16种精美风格的进度条组件库，适用于各种现代Web应用。

## 📦 组件列表

### 基础风格
- **ProgressBar** - 现代渐变风格（推荐）
- **MinimalProgressBar** - 极简线条风格
- **GlassProgressBar** - 玻璃拟态风格

### 科技风格
- **NeonProgressBar** - 霓虹发光风格
- **Neon2ProgressBar** - 电路板霓虹风格
- **Neon3ProgressBar** - 交互式霓虹风格
- **DigitalProgressBar** - 数字风格

### 动画风格
- **WaveProgressBar** - 波浪动画风格
- **PulseProgressBar** - 脉冲动画风格
- **ParticleProgressBar** - 粒子效果风格
- **LiquidProgressBar** - 液体波动风格

### 特殊风格
- **GradientProgressBar** - 多彩渐变风格
- **SegmentedProgressBar** - 分段式风格
- **CircularProgressBar** - 圆形进度条
- **SkeuomorphicProgressBar** - 拟物化风格
- **VintageProgressBar** - 复古风格

## 🚀 使用方法

### 单个组件导入
```tsx
import { ProgressBar } from './progress-bars/ProgressBar';

<ProgressBar
  value={50}
  max={100}
  onChange={(value) => console.log(value)}
  variant="primary"
/>
```

### 批量导入
```tsx
import { 
  ProgressBar, 
  NeonProgressBar, 
  CircularProgressBar 
} from './progress-bars';
```

### 完整演示
```tsx
import { ProgressBarDemo } from './progress-bars';

// 展示所有16种风格的完整演示页面
<ProgressBarDemo />
```

## 🎛️ 通用属性

大多数进度条组件支持以下通用属性：

```tsx
interface CommonProgressBarProps {
  value: number;        // 当前值
  max: number;          // 最大值
  onChange: (value: number) => void;  // 值变化回调
  className?: string;   // 自定义CSS类名
  disabled?: boolean;   // 是否禁用
}
```

## 🎨 特殊属性

### 颜色主题
```tsx
// NeonProgressBar, Neon2ProgressBar
color?: 'blue' | 'cyan' | 'purple' | 'green' | 'orange' | 'red'

// WaveProgressBar, PulseProgressBar, ParticleProgressBar
color?: 'blue' | 'green' | 'red' | 'purple' | 'cyan'
```

### 尺寸控制
```tsx
// 大部分组件支持
height?: 'thin' | 'medium' | 'thick'

// CircularProgressBar
size?: 'small' | 'medium' | 'large'
```

### 变体风格
```tsx
// ProgressBar
variant?: 'primary' | 'volume'

// GradientProgressBar
variant?: 'rainbow' | 'sunset' | 'ocean'

// DigitalProgressBar
variant?: 'matrix' | 'terminal'

// VintageProgressBar
theme?: 'steampunk' | 'neon-80s'
```

### 特殊配置
```tsx
// SegmentedProgressBar
segments?: number  // 分段数量

// CircularProgressBar
strokeWidth?: number  // 线条宽度
```

## 🎯 推荐使用场景

- **现代应用**: ProgressBar, GlassProgressBar, WaveProgressBar, Neon3ProgressBar
- **游戏界面**: NeonProgressBar, PulseProgressBar, SegmentedProgressBar, ParticleProgressBar, Neon2ProgressBar
- **音乐播放器**: GradientProgressBar, CircularProgressBar, LiquidProgressBar, Neon3ProgressBar
- **专业软件**: MinimalProgressBar, SkeuomorphicProgressBar, DigitalProgressBar
- **创意项目**: VintageProgressBar, ParticleProgressBar, GradientProgressBar
- **科技产品**: Neon2ProgressBar, NeonProgressBar, DigitalProgressBar

## 📝 注意事项

1. 所有组件都使用 React 函数组件和 TypeScript
2. 样式基于 Tailwind CSS 和自定义 CSS
3. 支持鼠标点击和拖拽交互
4. 内置动画效果，性能优化
5. 响应式设计，适配不同屏幕

## 🎨 自定义样式

每个组件都支持通过 `className` 属性传入自定义样式：

```tsx
<ProgressBar
  className="my-custom-progress"
  // 其他属性...
/>
```

## 🔧 开发与调试

查看 `ProgressBarDemo.tsx` 文件了解所有组件的使用示例和实时调节功能。