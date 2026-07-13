import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
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
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.styles.headingSM, color: colors.text.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  heading: { ...typography.styles.headingLG, marginBottom: spacing.xs },
  date: { ...typography.styles.bodySM, color: colors.text.tertiary, marginBottom: spacing.lg },
  sectionTitle: { ...typography.styles.headingSM, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.styles.bodyMD, color: colors.text.secondary, lineHeight: 22 },
});
