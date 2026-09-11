# Account Icon, Multi-Pet, Privacy Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bell icon with account icon, add multi-pet support (dogs + cats), and add an in-app privacy policy screen.

**Architecture:** Extend the existing `Dog` type with a `species` field. Create a new `AddPetScreen` with a species toggle and dynamic breed list. Swap the bell icon for a person icon. Add a static privacy policy screen wired into settings.

**Tech Stack:** React Native 0.76, TypeScript strict, Zustand, Ionicons, React Navigation

---

## File Structure

| File | Change | Purpose |
|------|--------|---------|
| `app/types/dog.ts` | Modify | Add `species` field to `Dog` and `CreateDogInput` |
| `app/store/dogStore.ts` | Modify | Default `species: 'dog'` in `addDog()` |
| `app/screens/dashboard/DashboardScreen.tsx` | Modify | Bell → person icon, remove badge, update Add button |
| `app/navigation/types.ts` | Modify | Add `AddPet` and `PrivacyPolicy` routes |
| `app/navigation/RootNavigator.tsx` | Modify | Add `AddPet` and `PrivacyPolicy` screens |
| `app/screens/pet/AddPetScreen.tsx` | Create | Multi-pet add form with species toggle |
| `app/screens/settings/PrivacyPolicyScreen.tsx` | Create | Static privacy policy text |
| `app/screens/settings/SettingsScreen.tsx` | Modify | Add privacy policy row |

---

### Task 1: Add `species` field to Dog type

**Files:**
- Modify: `dog-health-app/app/types/dog.ts:5-18, 67-76`

- [ ] **Step 1: Add `species` to the `Dog` interface**

Open `dog-health-app/app/types/dog.ts`. Add `species: 'dog' | 'cat';` after line 6 (`id: string;`):

```typescript
export interface Dog {
  id: string;
  species: 'dog' | 'cat';0
  name: string;
  breed: string;
  birthDate?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  gender?: 'male' | 'female';
  imageUrl?: string;
  microchipId?: string;
  vetInfo?: VetInfo;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add `species` to `CreateDogInput`**

In the same file, add `species?: 'dog' | 'cat';` to `CreateDogInput` (after line 67):

```typescript
export interface CreateDogInput {
  name: string;
  breed: string;
  species?: 'dog' | 'cat';
  birthDate?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  gender?: 'male' | 'female';
  imageUrl?: string;
  microchipId?: string;
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS (no errors — `species` is optional in `CreateDogInput`)

- [ ] **Step 4: Commit**

```bash
git add dog-health-app/app/types/dog.ts
git commit -m "feat: add species field to Dog type"
```

---

### Task 2: Default `species` in dog store

**Files:**
- Modify: `dog-health-app/app/store/dogStore.ts:62-80`

- [ ] **Step 1: Add default species in `addDog()`**

Open `dog-health-app/app/store/dogStore.ts`. In the `addDog` action, find where the dog object is constructed (around line 62-80). Add `species: input.species ?? 'dog'` to the new dog object:

```typescript
const newDog: Dog = {
  id: uuid(),
  species: input.species ?? 'dog',
  name: input.name,
  breed: input.breed,
  birthDate: input.birthDate,
  weight: input.weight,
  weightUnit: input.weightUnit,
  gender: input.gender,
  imageUrl: input.imageUrl,
  microchipId: input.microchipId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add dog-health-app/app/store/dogStore.ts
git commit -m "feat: default species to 'dog' in addDog"
```

---

### Task 3: Add navigation routes

**Files:**
- Modify: `dog-health-app/app/navigation/types.ts`
- Modify: `dog-health-app/app/navigation/RootNavigator.tsx`

- [ ] **Step 1: Add routes to `RootStackParamList`**

Open `dog-health-app/app/navigation/types.ts`. Add to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  MainTabs: undefined;
  DogProfile: { dogId: string };
  WeightHistory: undefined;
  VaccinationRecords: undefined;
  GeofenceManager: undefined;
  AddPet: undefined;
  PrivacyPolicy: undefined;
};
```

- [ ] **Step 2: Add screens to RootNavigator**

Open `dog-health-app/app/navigation/RootNavigator.tsx`. Import the new screens and add routes. Add these imports at the top:

```typescript
import AddPetScreen from '../screens/pet/AddPetScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
```

Add these `<Screen>` entries inside the `<Stack.Navigator>` (after the existing screens):

```tsx
<Screen name="AddPet" component={AddPetScreen} options={{ headerShown: false }} />
<Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS (will error on missing screen files — that's fine, we create them next)

- [ ] **Step 4: Commit**

```bash
git add dog-health-app/app/navigation/types.ts dog-health-app/app/navigation/RootNavigator.tsx
git commit -m "feat: add AddPet and PrivacyPolicy navigation routes"
```

---

### Task 4: Create AddPetScreen

**Files:**
- Create: `dog-health-app/app/screens/pet/AddPetScreen.tsx`

- [ ] **Step 1: Create the AddPetScreen**

Create `dog-health-app/app/screens/pet/AddPetScreen.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDogStore } from '../../store/dogStore';
import { colors, spacing, borderRadius, typography } from '../../theme';

const DOG_BREEDS = [
  'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
  'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler',
  'Dachshund', 'German Shorthaired Pointer',
];

const CAT_BREEDS = [
  'Domestic Shorthair', 'Persian', 'Siamese', 'Maine Coon',
  'Bengal', 'Ragdoll', 'British Shorthair', 'Abyssinian',
];

export default function AddPetScreen() {
  const navigation = useNavigation();
  const addDog = useDogStore((s) => s.addDog);

  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [gender, setGender] = useState<'male' | 'female' | undefined>();

  const breeds = species === 'dog' ? DOG_BREEDS : CAT_BREEDS;

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    if (!breed) {
      Alert.alert('Required', 'Please select a breed.');
      return;
    }

    const birthDate = age
      ? new Date(Date.now() - Number(age) * 365.25 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    addDog({
      name: name.trim(),
      breed,
      species,
      birthDate,
      weight: weight ? Number(weight) : undefined,
      weightUnit,
      gender,
    });

    navigation.goBack();
  }, [name, breed, species, age, weight, weightUnit, gender, addDog, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Pet</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Species Toggle */}
        <Text style={styles.label}>Species</Text>
        <View style={styles.speciesRow}>
          {(['dog', 'cat'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speciesPill, species === s && styles.speciesPillActive]}
              onPress={() => { setSpecies(s); setBreed(''); }}
            >
              <Ionicons
                name={s === 'dog' ? 'paw' : 'cat'}
                size={18}
                color={species === s ? colors.white : colors.text.secondary}
              />
              <Text style={[styles.speciesLabel, species === s && styles.speciesLabelActive]}>
                {s === 'dog' ? 'Dog' : 'Cat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Pet name"
          placeholderTextColor={colors.text.disabled}
        />

        {/* Breed */}
        <Text style={styles.label}>Breed *</Text>
        <View style={styles.breedGrid}>
          {breeds.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.breedPill, breed === b && styles.breedPillActive]}
              onPress={() => setBreed(b)}
            >
              <Text style={[styles.breedLabel, breed === b && styles.breedLabelActive]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age */}
        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 3"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
        />

        {/* Weight */}
        <Text style={styles.label}>Weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 25"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
          />
          <View style={styles.unitRow}>
            {(['kg', 'lb'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitPill, weightUnit === u && styles.unitPillActive]}
                onPress={() => setWeightUnit(u)}
              >
                <Text style={[styles.unitLabel, weightUnit === u && styles.unitLabelActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderPill, gender === g && styles.genderPillActive]}
              onPress={() => setGender(gender === g ? undefined : g)}
            >
              <Ionicons
                name={g === 'male' ? 'male' : 'female'}
                size={18}
                color={gender === g ? colors.white : colors.text.secondary}
              />
              <Text style={[styles.genderLabel, gender === g && styles.genderLabelActive]}>
                {g === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Add Pet</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading, fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  label: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  speciesRow: { flexDirection: 'row', gap: spacing.sm },
  speciesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  speciesPillActive: { backgroundColor: colors.primary },
  speciesLabel: { ...typography.body, color: colors.text.secondary },
  speciesLabelActive: { color: colors.white },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  breedPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  breedPillActive: { backgroundColor: colors.primary },
  breedLabel: { ...typography.caption, color: colors.text.secondary },
  breedLabelActive: { color: colors.white },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weightInput: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: spacing.xs },
  unitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  unitPillActive: { backgroundColor: colors.primary },
  unitLabel: { ...typography.body, color: colors.text.secondary },
  unitLabelActive: { color: colors.white },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  genderPillActive: { backgroundColor: colors.primary },
  genderLabel: { ...typography.body, color: colors.text.secondary },
  genderLabelActive: { color: colors.white },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add dog-health-app/app/screens/pet/AddPetScreen.tsx
git commit -m "feat: add AddPetScreen with dog/cat species toggle"
```

---

### Task 5: Create PrivacyPolicyScreen

**Files:**
- Create: `dog-health-app/app/screens/settings/PrivacyPolicyScreen.tsx`

- [ ] **Step 1: Create the PrivacyPolicyScreen**

Create `dog-health-app/app/screens/settings/PrivacyPolicyScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.date}>Last updated: July 13, 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.body}>
          DogVita collects information you provide directly, including your account details (email, phone number), pet profiles (name, breed, age, weight, gender), health records (weight history, vaccinations), and location data for geofencing features.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your information to provide and improve the app's features, including health monitoring, activity tracking, geofence alerts, and AI-powered health guidance. Your data is used to personalize your experience and send relevant notifications.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using Supabase (PostgreSQL) with row-level security. Local data is persisted on your device using AsyncStorage. We implement industry-standard encryption for data in transit and at rest.
        </Text>

        <Text style={styles.sectionTitle}>4. Bluetooth and Location Data</Text>
        <Text style={styles.body}>
          DogVita uses Bluetooth Low Energy (BLE) to connect to the DogVita collar hardware. Location data is collected when you enable geofencing features to monitor your pet's safety zones. This data is processed on-device and stored securely.
        </Text>

        <Text style={styles.sectionTitle}>5. AI Features</Text>
        <Text style={styles.body}>
          The AI chat feature uses your pet's profile and health data to provide personalized guidance. Web search queries may be sent to Wikipedia for real-time information. No personal data is shared with AI services beyond what you explicitly provide in conversations.
        </Text>

        <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
        <Text style={styles.body}>
          We use Supabase for authentication and data storage, and Wikipedia API for web search features. We do not sell or share your personal information with third parties for advertising purposes.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.body}>
          Your data is retained as long as your account is active. You may delete your account and all associated data at any time through the app settings.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.body}>
          DogVita is not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last updated" date.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this privacy policy, please contact us at support@dogvita.app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading, fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  heading: { ...typography.heading, fontSize: 24, marginBottom: spacing.xs },
  date: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.lg },
  sectionTitle: { ...typography.subheading, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text.secondary, lineHeight: 22 },
});
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add dog-health-app/app/screens/settings/PrivacyPolicyScreen.tsx
git commit -m "feat: add in-app privacy policy screen"
```

---

### Task 6: Replace bell icon with account icon

**Files:**
- Modify: `dog-health-app/app/screens/dashboard/DashboardScreen.tsx:6, 71-72, 137, 277-284`

- [ ] **Step 1: Remove notification imports and state**

Open `dog-health-app/app/screens/dashboard/DashboardScreen.tsx`.

Remove `useAlertStore` from imports (line 6 area). Remove the `unacknowledgedCount` derived state (line 137 area):

```typescript
// Remove this line:
const unacknowledgedCount = useAlertStore((s) => s.unacknowledgedCount);
```

- [ ] **Step 2: Replace bell icon with person icon**

Find the bell icon button (lines 277-284). Replace with:

```tsx
<TouchableOpacity
  style={styles.notifButton}
  activeOpacity={0.7}
  onPress={() => navigation.getParent()?.navigate('Settings')}
>
  <Ionicons name="person-outline" size={26} color={colors.text.primary} />
</TouchableOpacity>
```

- [ ] **Step 3: Remove notification badge style**

Remove the `notifBadge` style (lines 71-72):

```typescript
// Remove:
notifBadge: {
  position: 'absolute',
  top: 4,
  right: 4,
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: colors.status.error,
},
```

- [ ] **Step 4: Update Dashboard "Add" button to navigate to AddPet**

Find the "Add" button in the dog avatars row (lines 309-314). Change the `onPress`:

```tsx
<TouchableOpacity
  style={styles.addDogButton}
  activeOpacity={0.7}
  onPress={() => navigation.getParent()?.navigate('AddPet')}
>
  <Ionicons name="add" size={22} color={colors.primary} />
</TouchableOpacity>
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add dog-health-app/app/screens/dashboard/DashboardScreen.tsx
git commit -m "feat: replace bell icon with account icon, add button opens AddPet"
```

---

### Task 7: Add privacy policy row to Settings

**Files:**
- Modify: `dog-health-app/app/screens/settings/SettingsScreen.tsx`

- [ ] **Step 1: Add privacy policy navigation**

Open `dog-health-app/app/screens/settings/SettingsScreen.tsx`. Find the Account section (around lines 228-250). Add a "Privacy Policy" row after the "About" row:

```tsx
<SettingsRow
  icon="shield-checkmark-outline"
  iconColor="#6B625A"
  label="Privacy Policy"
  onPress={() => navigation.navigate('PrivacyPolicy' as never)}
/>
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add dog-health-app/app/screens/settings/SettingsScreen.tsx
git commit -m "feat: add privacy policy row to settings"
```

---

### Task 8: Build, install, and verify

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck one final time**

Run: `npm run typecheck` from `dog-health-app/`
Expected: PASS

- [ ] **Step 2: Sync to build path**

```powershell
robocopy "C:\Users\User\Desktop\Santo\DogVita\dog-health-app" "C:\R\dog-health-app" /MIR /XD node_modules /XD .git /XD android /XD ios
```

- [ ] **Step 3: Build release APK**

```powershell
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "C:\R\dog-health-app\android\gradlew.bat" -p "C:\R\dog-health-app\android" app:assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Install on device**

```powershell
& "C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r "C:\R\dog-health-app\android\app\build\outputs\apk\release\app-release.apk"
```

Expected: Success

- [ ] **Step 5: Launch app**

```powershell
& "C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.doghealth.app -c android.intent.category.LAUNCHER 1
```

- [ ] **Step 6: Manual verification checklist**

- [ ] Dashboard header shows person icon (not bell)
- [ ] Tapping person icon opens Settings
- [ ] Dashboard "Add" button opens AddPet screen
- [ ] AddPet screen shows Dog/Cat species toggle
- [ ] Can add a dog with name, breed, age, weight, gender
- [ ] Can add a cat with name, breed, age, weight, gender
- [ ] Both pets appear in dashboard avatar row
- [ ] Settings has "Privacy Policy" row
- [ ] Tapping "Privacy Policy" opens the policy screen
- [ ] Back navigation works on all new screens

- [ ] **Step 7: Push to remote**

```bash
git push origin master
```

- [ ] **Step 8: Final commit with all changes**

If any fixes were needed during verification, commit them:

```bash
git add -A
git commit -m "fix: verification fixes for account icon, multi-pet, privacy policy"
git push origin master
```
