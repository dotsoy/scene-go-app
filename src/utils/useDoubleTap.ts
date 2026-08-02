import { useEffect, useRef } from 'react';

/**
 * 双击/单击判定：窗口内第二击触发 onDouble，超时触发 onSingle。
 * 用于 SNAP（双击拍照/单击关闭）与 MIC（双击生成卡/单击关闭）。
 */
export function useDoubleTap(
  onSingle: () => void,
  onDouble: () => void,
  windowMs = 280,
): () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSingleRef = useRef(onSingle);
  const onDoubleRef = useRef(onDouble);
  onSingleRef.current = onSingle;
  onDoubleRef.current = onDouble;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return () => {
    if (timerRef.current) {
      // 双击窗口内第二次点击
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onDoubleRef.current();
      return;
    }
    // 首击：等待窗口；超时视为单击
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onSingleRef.current();
    }, windowMs);
  };
}
