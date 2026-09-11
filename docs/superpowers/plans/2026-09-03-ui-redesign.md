# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the DogVita mobile app UI to a "Card Based & Playful" style with Poppins/Inter fonts, colored elevated cards, sparkline health charts, and a full-conversation AI chat interface.

**Architecture:** Update theme tokens first (fonts, card styles), then restyle core components (Card, Button), then update screens (Dashboard, Health, AI Chat) in order of user-facing impact. Each task is self-contained and typechecks independently.

**Tech Stack:** React Native 0.76, TypeScript strict, Zustand, react-native-gifted-charts, Ionicons, Poppins + Inter fonts (via expo-font or manual linking)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `app/theme/colors.ts` | Modify | Add card background colors, gradient tokens |
| `app/theme/typography.ts` | Modify | Switch to Poppins (headings) + Inter (body) |
| `app/theme/shadows.ts` | Modify | Add elevated card shadow, colored shadows |
| `app/theme/index.ts` | Modify | Add new borderRadius tokens for playful style |
| `app/components/common/Card.tsx` | Modify | Add colored variant, softer radius, elevated style |
| `app/components/common/Button.tsx` | Modify | Match playful style (softer, rounded) |
| `app/components/charts/HeartRateChart.tsx` | Modify | Add sparkline mode + gradient fill |
| `app/components/charts/Sparkline.tsx` | Create | Reusable sparkline component for cards |
| `app/screens/dashboard/DashboardScreen.tsx` | Modify | Playful card layout, colored backgrounds |
| `app/screens/health/HealthOverviewScreen.tsx` | Modify | Sparkline cards, gradient chart detail |
| `app/screens/chat/ChatScreen.tsx` | Modify | Full conversation UI with bubble messages |
| `android/app/build.gradle` | Check | Verify font assets are linked |

---

## Task 1: Install & Link Poppins + Inter Fonts

**Files:**
- Modify: `dog-health-app/package.json` (add font deps)
- Create: `dog-health-app/android/app/src/main/assets/fonts/` (font files)

- [ ] **Step 1: Install font packages**

Run from `dog-health-app/`:
```bash
npm install @react-native-google-fonts/poppins @react-native-google-fonts/inter
```

- [ ] **Step 2: Verify fonts installed**

Run:
```bash
npm ls @react-native-google-fonts/poppins @react-native-google-fonts/inter
```
Expected: both listed without errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/package.json dog-health-app/package-lock.json
git commit -m "deps: add Poppins and Inter font packages"
```

---

## Task 2: Update Typography Theme

**Files:**
- Modify: `dog-health-app/app/theme/typography.ts`

- [ ] **Step 1: Replace fontFamily with Poppins + Inter**

Replace the entire `fontFamily` object and import in `typography.ts`:

```typescript
import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@react-native-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@react-native-google-fonts/inter';

// ponytail: load fonts at app init, not per-component
const fontFamily = {
  regular: Poppins_400Regular || 'Poppins-Regular',
  medium: Poppins_500Medium || 'Poppins-Medium',
  semibold: Poppins_600SemiBold || 'Poppins-SemiBold',
  bold: Poppins_700Bold || 'Poppins-Bold',
  bodyRegular: Inter_400Regular || 'Inter-Regular',
  bodyMedium: Inter_500Medium || 'Inter-Medium',
  bodySemibold: Inter_600SemiBold || 'Inter-SemiBold',
};
```

- [ ] **Step 2: Update heading styles to use Poppins**

Update `styles` object — headings use `fontFamily.bold`/`fontFamily.semibold` (Poppins), body uses `fontFamily.bodyRegular`/`fontFamily.bodyMedium` (Inter):

```typescript
styles: {
  headingXL: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  } as TextStyle,
  headingLG: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  } as TextStyle,
  headingMD: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  } as TextStyle,
  headingSM: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  } as TextStyle,
  bodyLG: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
    fontFamily: fontFamily.bodyRegular,
    color: colors.text.primary,
  } as TextStyle,
  bodyMD: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: fontFamily.bodyRegular,
    color: colors.text.primary,
  } as TextStyle,
  bodySM: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: fontFamily.bodyRegular,
    color: colors.text.secondary,
  } as TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: fontFamily.bodyRegular,
    color: colors.text.tertiary,
  } as TextStyle,
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  } as TextStyle,
  labelLG: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  } as TextStyle,
  buttonLG: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.3,
  } as TextStyle,
  buttonMD: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
  } as TextStyle,
  buttonSM: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.2,
  } as TextStyle,
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
},
```

- [ ] **Step 3: Typecheck**

Run from `dog-health-app/`:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/theme/typography.ts
git commit -m "feat: switch to Poppins headings + Inter body fonts"
```

---

## Task 3: Add Font Loading to App Entry

**Files:**
- Modify: `dog-health-app/app/App.tsx`

- [ ] **Step 1: Add useFonts hook at top of App**

Read `App.tsx` first, then add font loading. The app must wait for fonts before rendering:

```typescript
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@react-native-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@react-native-google-fonts/inter';
```

Add inside the App component:
```typescript
const [fontsLoaded] = useFonts({
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
});

if (!fontsLoaded) return null;
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/App.tsx
git commit -m "feat: load Poppins and Inter fonts at app init"
```

---

## Task 4: Update Shadows Theme

**Files:**
- Modify: `dog-health-app/app/theme/shadows.ts`

- [ ] **Step 1: Add elevatedCard and coloredShadow tokens**

Read `shadows.ts` first, then add after existing shadow definitions:

```typescript
// ponytail: playful elevated shadow for colored cards
elevatedCard: {
  shadowColor: '#3D322A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
} as ViewStyle,

// ponytail: colored glow shadows for health metric cards
glowRed: {
  shadowColor: '#F44336',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle,

glowGreen: {
  shadowColor: '#4CAF50',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle,

glowOrange: {
  shadowColor: '#F3A93B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle,

glowBlue: {
  shadowColor: '#5B9BD5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle,

glowPurple: {
  shadowColor: '#7E57C2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle,
```

- [ ] **Step 2: Update Shadows type export**

Add to the `Shadows` type:
```typescript
elevatedCard: ViewStyle;
glowRed: ViewStyle;
glowGreen: ViewStyle;
glowOrange: ViewStyle;
glowBlue: ViewStyle;
glowPurple: ViewStyle;
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/theme/shadows.ts
git commit -m "feat: add elevated and colored glow shadow tokens"
```

---

## Task 5: Update Card Component

**Files:**
- Modify: `dog-health-app/app/components/common/Card.tsx`

- [ ] **Step 1: Add colored variant and softer radius**

Update Card component to support `color` prop and use softer borderRadius:

```typescript
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'colored';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  color?: string; // background color for 'colored' variant
}
```

Update `getVariantStyle` to handle `colored`:
```typescript
case 'colored':
  return {
    backgroundColor: color || colors.background.card,
    borderRadius: borderRadius.xl,
    padding: getPadding(),
    ...shadows.elevatedCard,
  };
```

Update default variant to use softer radius:
```typescript
default:
  return {
    ...styles.default,
    padding: getPadding(),
    borderRadius: borderRadius.xl,
  };
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/components/common/Card.tsx
git commit -m "feat: add colored card variant with elevated shadow"
```

---

## Task 6: Create Sparkline Component

**Files:**
- Create: `dog-health-app/app/components/charts/Sparkline.tsx`

- [ ] **Step 1: Create Sparkline component**

```typescript
/**
 * Sparkline - Compact inline chart for card summaries
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface SparklineProps {
  data: number[];
  color: string;
  label: string;
  value: string;
  unit: string;
  style?: ViewStyle;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  label,
  value,
  unit,
  style,
}) => {
  const chartData = data.slice(-12).map((v) => ({ value: v }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      {data.length > 1 ? (
        <LineChart
          data={chartData}
          width={120}
          height={32}
          color={color}
          thickness={2}
          curved
          areaChart
          startFillColor={color + '30'}
          endFillColor={color + '05'}
          hideRules
          hideYAxisText
          hideAxesAndRules
          yAxisColor="transparent"
          xAxisColor="transparent"
          spacing={8}
          dataPointsColor={color}
          dataPointsRadius={0}
          maxValue={Math.max(...data) + 10}
          minValue={Math.min(...data) - 10}
        />
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>--</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
  },
  unit: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginLeft: 2,
  },
  noData: {
    height: 32,
    justifyContent: 'center',
  },
  noDataText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
});

export default Sparkline;
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/components/charts/Sparkline.tsx
git commit -m "feat: add Sparkline component for card health summaries"
```

---

## Task 7: Redesign DashboardScreen

**Files:**
- Modify: `dog-health-app/app/screens/dashboard/DashboardScreen.tsx`

- [ ] **Step 1: Update styles for playful card layout**

Replace the `styles` object in DashboardScreen. Key changes: colored snapshot card, softer card radiuses, playful quick-action icons with colored backgrounds, section headers with Poppins font:

```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { ...typography.styles.bodySM, color: colors.text.secondary },
  headerName: { ...typography.styles.headingXL, color: colors.text.primary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifButton: { padding: 8 },
  dogsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  dogAvatar: { alignItems: 'center', width: 72 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.background.card,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.background.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border.DEFAULT,
  },
  dogNameLabel: { ...typography.styles.caption, color: colors.text.primary, marginTop: 6, fontWeight: '500', textAlign: 'center' },
  addDogBtn: { alignItems: 'center', width: 72 },
  addIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.background.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary.DEFAULT,
  },
  // Colored snapshot card — playful elevated
  snapshotCard: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    ...shadows.elevatedCard,
  },
  snapshotLabel: { ...typography.styles.overline, color: '#FFFFFFCC', marginBottom: 8, letterSpacing: 1.5 },
  snapshotTitle: { fontSize: 22, fontWeight: '700', fontFamily: typography.fontFamily.bold, color: '#FFFFFF', marginBottom: 4 },
  snapshotDesc: { fontSize: 14, color: '#FFFFFFCC', marginBottom: 16, lineHeight: 20 },
  snapshotActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markDoneBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.pill,
    paddingVertical: 10, paddingHorizontal: 20, gap: 8,
  },
  markDoneText: { fontSize: 15, fontWeight: '600', color: colors.primary.DEFAULT },
  allBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF22', borderRadius: borderRadius.pill,
    paddingVertical: 10, paddingHorizontal: 16, gap: 4,
  },
  allBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  // No-alert card — soft green
  noAlertCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.xl,
    padding: 20, marginBottom: 24,
    alignItems: 'center',
    ...shadows.sm,
  },
  noAlertIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4CAF5018', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noAlertTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  noAlertDesc: { fontSize: 13, color: colors.text.tertiary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily: typography.fontFamily.bold, color: colors.text.primary },
  seeAllLink: { fontSize: 14, fontWeight: '600', color: colors.primary.DEFAULT },
  // Quick actions — colored circular icons
  quickLogRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickLogItem: { alignItems: 'center', gap: 8 },
  quickLogIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  quickLogLabel: { fontSize: 12, fontWeight: '500', color: colors.text.primary },
  // Upcoming items — colored left border accent
  upcomingItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: 16, marginBottom: 12,
    ...shadows.sm,
  },
  upcomingIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3A93B18', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  upcomingInfo: { flex: 1 },
  upcomingTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  upcomingSub: { fontSize: 13, color: colors.text.tertiary, marginTop: 2 },
  upcomingTag: { backgroundColor: '#F3A93B18', borderRadius: borderRadius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  upcomingTagText: { fontSize: 12, fontWeight: '600', color: colors.primary.DEFAULT },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: 16, marginBottom: 12,
    ...shadows.sm,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceText: {},
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  deviceStatus: { fontSize: 13, color: colors.text.tertiary, marginTop: 2 },
  emptyUpcoming: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: 24, alignItems: 'center', marginBottom: 12,
    ...shadows.sm,
  },
  emptyUpcomingText: { fontSize: 14, color: colors.text.tertiary, marginTop: 8 },
});
```

- [ ] **Step 2: Update quick action icons to use colored backgrounds**

In the quick actions section, update `quickLogIcon` background to use each action's color at 10% opacity:

Find the `quickLogIcon` style usage and replace with:
```typescript
<View style={[styles.quickLogIcon, { backgroundColor: action.color + '15' }]}>
  <Ionicons name={action.icon} size={24} color={action.color} />
</View>
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/screens/dashboard/DashboardScreen.tsx
git commit -m "feat: redesign dashboard with playful colored cards"
```

---

## Task 8: Redesign HealthOverviewScreen

**Files:**
- Modify: `dog-health-app/app/screens/health/HealthOverviewScreen.tsx`

- [ ] **Step 1: Add Sparkline import and metric cards with sparklines**

Replace the current `MetricChip` with a colored card that includes a sparkline. Update imports:

```typescript
import Sparkline from '../../components/charts/Sparkline';
```

Replace the chip grid section with colored metric cards:

```typescript
{/* Metric Cards with Sparklines */}
<View style={styles.metricCards}>
  <View style={[styles.metricCard, { backgroundColor: '#FFEBEE', ...shadows.glowRed }]}>
    <Sparkline
      data={heartRateHistory.slice(-20).map((d) => d.bpm)}
      color="#F44336"
      label="Heart Rate"
      value={latestHR ? String(latestHR) : '--'}
      unit="bpm"
    />
  </View>
  <View style={[styles.metricCard, { backgroundColor: '#FFF3E0', ...shadows.glowOrange }]}>
    <Sparkline
      data={temperatureHistory.slice(-20).map((d) => d.celsius)}
      color="#FF9800"
      label="Temperature"
      value={latestTemp ? latestTemp.celsius.toFixed(1) : '--'}
      unit="°C"
    />
  </View>
</View>
<View style={styles.metricCards}>
  <View style={[styles.metricCard, { backgroundColor: '#E8F5E9', ...shadows.glowGreen }]}>
    <Sparkline
      data={activityHistory.slice(-20).map((d) => d.steps)}
      color="#4CAF50"
      label="Steps"
      value={latestActivity ? String(latestActivity.steps) : '--'}
      unit="today"
    />
  </View>
  <View style={[styles.metricCard, { backgroundColor: '#E3F2FD', ...shadows.glowBlue }]}>
    <Sparkline
      data={[]}
      color="#5B9BD5"
      label="Battery"
      value={latestBattery !== null ? String(latestBattery) : '--'}
      unit="%"
    />
  </View>
</View>
```

- [ ] **Step 2: Update styles for metric cards**

Add to styles:
```typescript
metricCards: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 12,
},
metricCard: {
  flex: 1,
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
},
```

Update the `container` background and `scrollContent` padding to match playful style:
```typescript
container: { flex: 1, backgroundColor: colors.background.primary },
scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
```

- [ ] **Step 3: Update Activity Summary card**

Update the activity card to use colored backgrounds:
```typescript
<View style={[styles.activityCircle, { backgroundColor: '#E8F5E9' }]}>
  <Ionicons name="walk" size={20} color="#4CAF50" />
</View>
```

(Same pattern for calories and sleep circles)

- [ ] **Step 4: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/screens/health/HealthOverviewScreen.tsx
git commit -m "feat: redesign health screen with sparkline metric cards"
```

---

## Task 9: Redesign ChatScreen (AI Health Assistant)

**Files:**
- Modify: `dog-health-app/app/screens/chat/ChatScreen.tsx`

- [ ] **Step 1: Read current ChatScreen**

Read `dog-health-app/app/screens/chat/ChatScreen.tsx` to understand current structure.

- [ ] **Step 2: Update message bubble styles**

Replace message rendering with bubble-style messages. Key changes:
- User messages: right-aligned, primary color background, white text
- AI messages: left-aligned, card background, dark text
- Typing indicator with animated dots
- Full conversation layout with suggestion chips

Update the message container style:
```typescript
messageContainer: {
  marginVertical: 4,
  marginHorizontal: 16,
},
userMessage: {
  backgroundColor: colors.primary.DEFAULT,
  borderRadius: borderRadius.xl,
  borderBottomRightRadius: 4,
  padding: 14,
  maxWidth: '80%',
  alignSelf: 'flex-end',
  ...shadows.sm,
},
aiMessage: {
  backgroundColor: colors.background.elevated,
  borderRadius: borderRadius.xl,
  borderBottomLeftRadius: 4,
  padding: 14,
  maxWidth: '85%',
  alignSelf: 'flex-start',
  ...shadows.sm,
},
userText: {
  color: colors.white,
  fontSize: 15,
  lineHeight: 22,
},
aiText: {
  color: colors.text.primary,
  fontSize: 15,
  lineHeight: 22,
},
```

- [ ] **Step 3: Add suggestion chips at bottom of conversation**

Add a horizontal scroll of suggestion chips above the input:
```typescript
const SUGGESTIONS = [
  'How is my dog\'s health?',
  'Check heart rate',
  'Activity summary',
  'Any alerts?',
];

// In render, above the input:
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow}>
  {SUGGESTIONS.map((s) => (
    <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSend(s)}>
      <Text style={styles.suggestionText}>{s}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

Add styles:
```typescript
suggestionsRow: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  maxHeight: 48,
},
suggestionChip: {
  backgroundColor: colors.primary[50],
  borderRadius: borderRadius.pill,
  paddingVertical: 8,
  paddingHorizontal: 16,
  marginRight: 8,
  borderWidth: 1,
  borderColor: colors.primary[200],
},
suggestionText: {
  ...typography.styles.bodySM,
  color: colors.primary.dark,
  fontWeight: '500',
},
```

- [ ] **Step 4: Update input bar style**

Update the text input area to be a rounded pill with send button inside:
```typescript
inputBar: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.background.elevated,
  borderRadius: borderRadius.pill,
  paddingHorizontal: 16,
  paddingVertical: 8,
  marginHorizontal: 16,
  marginBottom: 12,
  ...shadows.sm,
},
input: {
  flex: 1,
  fontSize: 15,
  color: colors.text.primary,
  paddingVertical: 8,
},
sendButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.primary.DEFAULT,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 8,
},
```

- [ ] **Step 5: Typecheck**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add dog-health-app/app/screens/chat/ChatScreen.tsx
git commit -m "feat: redesign AI chat with bubble messages and suggestion chips"
```

---

## Task 10: Verify Full Build

**Files:**
- None (verification only)

- [ ] **Step 1: Typecheck both projects**

Run from `dog-health-app/`:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 2: Lint**

Run:
```bash
npm run lint
```
Expected: no errors or only pre-existing warnings.

- [ ] **Step 3: Sync to build path and test**

```powershell
robocopy "C:\Users\User\Desktop\Santo\DogVita\dog-health-app" "C:\R\dog-health-app" /MIR /XD "node_modules" ".git" "android" "ios" "graphify-out" /XF "*.apk" /np /njh /njs /ndl /nc /ns
```

- [ ] **Step 4: Final commit (if any fixups needed)**

```bash
cd C:\Users\User\Desktop\Santo\DogVita
git add -A
git commit -m "fix: UI redesign cleanup and typecheck fixes"
```
