/**
 * ChatHistoryScreen - Browse, search, and manage past AI conversations
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useChatStore, type ChatSession } from '../../store/chatStore';
import { spacing, borderRadius } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatHistory'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E9CD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1A17',
  },
  searchRow: {
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#1F1A17',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.page,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3A93B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1A17',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
    color: '#A39888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.page * 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3A93B10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1A17',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    color: '#A39888',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default function ChatHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const sessions = useChatStore((s) => s.sessions);
  const loadSession = useChatStore((s) => s.loadSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const searchSessions = useChatStore((s) => s.searchSessions);
  const exportSession = useChatStore((s) => s.exportSession);

  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  const displaySessions = useMemo(() => {
    if (isSearching) {
      return searchSessions(searchQuery);
    }
    return sessions;
  }, [sessions, searchQuery, isSearching, searchSessions]);

  const handleLoadSession = useCallback(
    (session: ChatSession) => {
      loadSession(session.id);
      navigation.goBack();
    },
    [loadSession, navigation],
  );

  const handleDelete = useCallback(
    (session: ChatSession) => {
      Alert.alert(
        'Delete conversation',
        `Delete "${session.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteSession(session.id),
          },
        ],
      );
    },
    [deleteSession],
  );

  const handleExport = useCallback(
    async (session: ChatSession) => {
      const content = exportSession(session.id);
      if (content) {
        await Share.share({ message: content, title: session.title });
      }
    },
    [exportSession],
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const renderSession = useCallback(
    ({ item }: { item: ChatSession }) => {
      const userMsgCount = item.messages.filter((m) => m.role === 'user').length;
      return (
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => handleLoadSession(item)}
          onLongPress={() => {
            Alert.alert(item.title, `${userMsgCount} messages`, [
              { text: 'Load', onPress: () => handleLoadSession(item) },
              { text: 'Export', onPress: () => handleExport(item) },
              { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.sessionIcon}>
            <Ionicons name="chatbubble" size={16} color="#F3A93B" />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.sessionMeta}>
              {formatDate(item.updatedAt)} · {userMsgCount} message{userMsgCount !== 1 ? 's' : ''}
              {item.dogName ? ` · ${item.dogName}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#A39888" />
        </TouchableOpacity>
      );
    },
    [handleLoadSession, handleDelete, handleExport],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1F1A17" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
          placeholderTextColor="#A39888"
          returnKeyType="search"
        />
      </View>

      {/* Sessions list */}
      {displaySessions.length > 0 ? (
        <FlatList
          data={displaySessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={28} color="#F3A93B" />
          </View>
          <Text style={styles.emptyTitle}>
            {isSearching ? 'No results' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptyText}>
            {isSearching
              ? 'Try a different search term'
              : 'Start chatting with the AI assistant to build your history'}
          </Text>
        </View>
      )}
    </View>
  );
}
