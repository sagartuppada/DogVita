/**
 * useTheme - Hook for accessing theme
 */

import { useMemo } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

export const useTheme = () => {
  return useMemo(
    () => ({
      colors,
      spacing,
      typography,
      shadows,
      borderRadius,
    }),
    []
  );
};

export default useTheme;