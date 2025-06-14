import React, { useRef, useEffect, useState } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化音频分析器
  useEffect(() => {
    if (!audioRef.current || isInitialized) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio visualizer:', error);
    }
  }, [audioRef, isInitialized]);

  // 绘制可视化
  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = analyser.frequencyBinCount;

    analyser.getByteFrequencyData(dataArray);

    // 清除画布
    ctx.fillStyle = 'rgb(17, 24, 39)'; // bg-gray-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制频谱条
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

      // 创建渐变色
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#3b82f6'); // blue-500
      gradient.addColorStop(0.5, '#60a5fa'); // blue-400
      gradient.addColorStop(1, '#93c5fd'); // blue-300

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  };

  // 开始/停止动画
  useEffect(() => {
    if (isPlaying && isInitialized) {
      draw();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized]);

  // 清理
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full h-full rounded-lg bg-gray-900"
      />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <span className="text-gray-500 text-sm">音频可视化</span>
        </div>
      )}
    </div>
  );
}; 