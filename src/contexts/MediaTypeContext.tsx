import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  MediaType, 
  MediaTypeState, 
  MediaTypeSwitchAction, 
  getMediaTypeInfo,
  getNextMediaType
} from '../types/media';
import { mediaTypeStorage } from '../utils/storage';

// 初始状态
const initialState: MediaTypeState = {
  currentType: MediaType.AUDIO,
  isTransitioning: false,
  lastSwitchTime: 0
};

// Reducer函数
const mediaTypeReducer = (state: MediaTypeState, action: MediaTypeSwitchAction): MediaTypeState => {
  switch (action.type) {
    case 'SWITCH_MEDIA_TYPE':
      if (action.payload?.mediaType && action.payload.mediaType !== state.currentType) {
        return {
          ...state,
          currentType: action.payload.mediaType,
          isTransitioning: true,
          lastSwitchTime: Date.now()
        };
      }
      return state;

    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.payload?.isTransitioning ?? false
      };

    case 'RESET_MEDIA_TYPE':
      return {
        ...initialState,
        currentType: action.payload?.mediaType ?? MediaType.AUDIO
      };

    default:
      return state;
  }
};

// Context类型定义
interface MediaTypeContextType {
  state: MediaTypeState;
  switchMediaType: (type: MediaType) => void;
  toggleMediaType: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
  resetMediaType: (type?: MediaType) => void;
  getCurrentTypeInfo: () => ReturnType<typeof getMediaTypeInfo>;
  isAudioMode: boolean;
  isVideoMode: boolean;
}

// 创建Context
const MediaTypeContext = createContext<MediaTypeContextType | undefined>(undefined);

// Provider组件属性
interface MediaTypeProviderProps {
  children: ReactNode;
  initialMediaType?: MediaType;
}

// Provider组件
export const MediaTypeProvider: React.FC<MediaTypeProviderProps> = ({ 
  children, 
  initialMediaType = MediaType.AUDIO 
}) => {
  const [state, dispatch] = useReducer(mediaTypeReducer, {
    ...initialState,
    currentType: initialMediaType
  });

  // 从存储加载媒体类型偏好和状态
  useEffect(() => {
    const savedMediaType = mediaTypeStorage.getMediaType();
    
    if (savedMediaType && savedMediaType !== state.currentType) {
      dispatch({
        type: 'SWITCH_MEDIA_TYPE',
        payload: { mediaType: savedMediaType }
      });
      // 延迟设置过渡状态为false
      setTimeout(() => {
        dispatch({
          type: 'SET_TRANSITIONING',
          payload: { isTransitioning: false }
        });
      }, 100);
    }
  }, []);

  // 保存媒体类型状态到存储
  useEffect(() => {
    mediaTypeStorage.setMediaType(state.currentType);
    mediaTypeStorage.setMediaTypeState(state);
  }, [state]);

  // 切换到指定媒体类型
  const switchMediaType = (type: MediaType) => {
    if (type !== state.currentType) {
      dispatch({
        type: 'SWITCH_MEDIA_TYPE',
        payload: { mediaType: type }
      });
      
      // 延迟设置过渡状态为false
      setTimeout(() => {
        dispatch({
          type: 'SET_TRANSITIONING',
          payload: { isTransitioning: false }
        });
      }, 300); // 300ms过渡动画时间
    }
  };

  // 切换媒体类型（在音频和视频之间切换）
  const toggleMediaType = () => {
    const nextType = getNextMediaType(state.currentType);
    switchMediaType(nextType);
  };

  // 设置过渡状态
  const setTransitioning = (isTransitioning: boolean) => {
    dispatch({
      type: 'SET_TRANSITIONING',
      payload: { isTransitioning }
    });
  };

  // 重置媒体类型
  const resetMediaType = (type?: MediaType) => {
    dispatch({
      type: 'RESET_MEDIA_TYPE',
      payload: { mediaType: type }
    });
  };

  // 获取当前媒体类型信息
  const getCurrentTypeInfo = () => getMediaTypeInfo(state.currentType);

  // 便捷的布尔值
  const isAudioMode = state.currentType === MediaType.AUDIO;
  const isVideoMode = state.currentType === MediaType.VIDEO;

  const contextValue: MediaTypeContextType = {
    state,
    switchMediaType,
    toggleMediaType,
    setTransitioning,
    resetMediaType,
    getCurrentTypeInfo,
    isAudioMode,
    isVideoMode
  };

  return (
    <MediaTypeContext.Provider value={contextValue}>
      {children}
    </MediaTypeContext.Provider>
  );
};

// Hook for using the context
export const useMediaType = (): MediaTypeContextType => {
  const context = useContext(MediaTypeContext);
  if (context === undefined) {
    throw new Error('useMediaType must be used within a MediaTypeProvider');
  }
  return context;
};

// 导出Context以供测试使用
export { MediaTypeContext }; 