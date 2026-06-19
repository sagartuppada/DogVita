# Design: Enforce Onboarding Auth & Remove Test Mode

## Summary

Remove all skip/bypass paths from onboarding, enforce Supabase auth, and add server-side data protection. Three approaches combined: surgical removal, onboarding gate, and RLS enforcement.

## Problem

The app accepts any random OTP without Supabase verification. Users can skip the entire onboarding flow via "Skip for now" buttons, which loads demo data and marks onboarding complete. No data is written to Supabase.

## Scope

**In scope:**
- Remove skip button from WelcomeScreen (PairDeviceScreen keeps its skip — user may not have collar)
- Remove TEST_MODE from auth service
- Add onboarding navigation guard
- Schema RLS policies + auto-create profile trigger already exist — verify they're applied in Supabase Dashboard
- Wire SetupDogProfileScreen to save dog to Supabase

**Out of scope:**
- Real BLE pairing (still simulated, but skippable)
- Real-time data subscriptions
- Push notifications

---

## Approach A: Surgical Removal

### WelcomeScreen.tsx

**Remove:**
- `handleSkip()` function (line 28-35)
- All `loadDemoData` imports (lines 22-26)
- "Skip for Now" TouchableOpacity (lines 89-91)
- `skipButton` and `skipText` styles (lines 161-168)

**Keep:**
- "Get Started" button → navigates to `AddPhone`

### PairDeviceScreen.tsx

**Keep:**
- "Skip for Now" button (user may not have collar)
- Remove any demo data loading on skip (there is none currently)

### auth/service.ts

**Remove entirely:**
- `TEST_MODE` constant (line 9)
- `TEST_OTP` constant (line 10)
- `testUser` field (line 14)
- All `if (TEST_MODE)` branches in:
  - `sendOTP` (lines 26-29)
  - `verifyOTP` (lines 48-69)
  - `signOut` (lines 104-107)
  - `getCurrentUser` (lines 121-123)
  - `getSession` (lines 137-148)
  - `onAuthStateChange` (lines 168-173)
  - `refreshSession` (lines 200-202)
- `isTestMode()` method (lines 215-217)

**Result:** All auth methods always call Supabase. No local bypass.

---

## Approach B: Onboarding Navigation Guard

### RootNavigator.tsx

Add an `OnboardingGuard` component that wraps the `OnboardingNavigator`:

```typescript
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) return null; // or a splash screen
  if (hasSession) {
    // Already authenticated — skip to main app
    // Navigation will handle this via RootNavigator
    return null;
  }
  return <>{children}</>;
};
```

The RootNavigator will check both `hasCompletedOnboarding` (persisted in settings) AND auth state. If the user has a valid Supabase session, onboarding is bypassed regardless of the settings flag.

### Navigation flow enforcement

| Step | Guard check | Action on fail |
|------|-------------|----------------|
| AddPhone → OTP | `sendOTP()` must succeed | Stay on AddPhone with error |
| OTP → SetupDog | `verifyOTP()` must return session | Stay on OTP with error |
| SetupDog → PairDevice | Dog must be saved to Supabase | Stay on SetupDog with error |
| PairDevice → Main | `setOnboardingComplete()` | Navigate to Main |

---

## Approach C: Server-Side Enforcement

### Schema: RLS Policies

RLS policies already exist in `supabase/schema.sql` (lines 152-214). All tables have proper `auth.uid()` checks. Just need to verify they're applied in the Supabase Dashboard.

### Schema: Auto-create profile on signup

Already exists in `supabase/schema.sql` (lines 22-37). The `handle_new_user()` trigger auto-creates a profile row when a user signs up via `auth.users`.

### SetupDogProfileScreen.tsx

Wire the "Continue" button to save the dog to Supabase:

```typescript
const handleContinue = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase.from('dogs').insert({
    owner_id: user.id,
    name: name.trim(),
    breed,
    birth_date: age ? calculateBirthDate(age) : nu
    weight: weight ? parseFloat(weight) : null,
    weight_unit: 'kg',
    gender: 'unknown',
  }).select().single();

  if (!error) {
    navigation.navigate('PairDevice');
  }
};
```

---

## Files Modified

| File | Changes |
|------|---------|
| `app/screens/onboarding/WelcomeScreen.tsx` | Remove skip button + demo data imports |
| `app/services/auth/service.ts` | Remove TEST_MODE, all test branches |
| `app/navigation/RootNavigator.tsx` | Add OnboardingGuard (auth state check) |
| `app/screens/onboarding/SetupDogProfileScreen.tsx` | Wire to Supabase insert |
| `supabase/schema.sql` | Already has RLS + profile trigger — no changes needed |

## Success Criteria

1. User cannot reach Dashboard without completing phone + OTP + dog profile
2. All OTPs are verified against Supabase (no test mode)
3. All data writes require authenticated user (RLS)
4. BLE pairing remains skippable
5. Profile auto-created on signup
