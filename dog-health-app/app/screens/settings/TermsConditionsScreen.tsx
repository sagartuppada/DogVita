import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';

export default function TermsConditionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Terms & Conditions</Text>
        <Text style={styles.date}>Last updated: July 14, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using DogVita, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of the App</Text>
        <Text style={styles.body}>
          DogVita is designed for monitoring your pet's health and activity using the DogVita collar hardware. The app provides health insights, activity tracking, geofencing, and AI-powered guidance. DogVita is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or health condition in animals or humans.
        </Text>

        <Text style={styles.sectionTitle}>3. Account Registration</Text>
        <Text style={styles.body}>
          You must create an account to use DogVita. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate and complete information when creating your account and to update it as necessary.
        </Text>

        <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, design, graphics, code, and other materials in DogVita are owned by or licensed to DogVita and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our app or its content without our prior written consent.
        </Text>

        <Text style={styles.sectionTitle}>5. User Content</Text>
        <Text style={styles.body}>
          You retain ownership of all data you input into DogVita, including pet profiles, health records, and other personal information. By using the app, you grant DogVita a limited license to process this data solely to provide the app's features and services to you. We will not use your data for purposes beyond delivering the app's functionality without your explicit consent.
        </Text>

        <Text style={styles.sectionTitle}>6. Disclaimers</Text>
        <Text style={styles.body}>
          DogVita is provided "as is" without warranties of any kind. The health information, AI guidance, and activity data provided by the app are for informational purposes only and should not be relied upon as a substitute for professional veterinary advice, diagnosis, or treatment. Always consult a qualified veterinarian regarding your pet's health.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the maximum extent permitted by law, DogVita shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, arising out of or related to your use of the app. Our total liability shall not exceed the amount you paid for the app in the twelve (12) months preceding the claim.
        </Text>

        <Text style={styles.sectionTitle}>8. Modifications to Terms</Text>
        <Text style={styles.body}>
          We reserve the right to modify these Terms & Conditions at any time. We will notify you of any material changes by posting the updated terms in the app and updating the "Last updated" date. Your continued use of the app after such changes constitutes your acceptance of the updated terms.
        </Text>

        <Text style={styles.sectionTitle}>9. Governing Law</Text>
        <Text style={styles.body}>
          These Terms & Conditions are governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these terms shall be resolved in the applicable jurisdiction.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions about these Terms & Conditions, please contact us at support@dogvita.app.
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
