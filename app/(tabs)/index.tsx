import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Usuario, Horario, getAllUsuarios, getAllHorarios } from '../../database/initDatabase';
import { EmptyState } from '../../components/EmptyState';

interface UsuarioComHorarios extends Usuario {
  totalHorarios: number;
}

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<UsuarioComHorarios[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [us, hs] = await Promise.all([getAllUsuarios(), getAllHorarios()]);
    const mapped = us.map((u) => ({
      ...u,
      totalHorarios: hs.filter((h) => h.id_usuario === u.id).length,
    }));
    setUsuarios(mapped);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: UsuarioComHorarios }) => (
    <View style={styles.card}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.nome.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.nome}</Text>
        <Text style={styles.cardSub}>
          {item.totalHorarios === 0
            ? 'Nenhum horário configurado'
            : `${item.totalHorarios} horário${item.totalHorarios > 1 ? 's' : ''} configurado${item.totalHorarios > 1 ? 's' : ''}`}
        </Text>
      </View>
      <View style={[styles.badge, item.totalHorarios > 0 ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={[styles.badgeText, item.totalHorarios > 0 ? styles.badgeTextActive : styles.badgeTextInactive]}>
          {item.totalHorarios > 0 ? '✅ Ativo' : '⏸ Sem regras'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🛡️ KidSafe</Text>
        <Text style={styles.subtitle}>Gerencie o tempo de internet por usuário</Text>
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState message="Nenhum usuário encontrado" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1565C0']} />
        }
        contentContainerStyle={usuarios.length === 0 ? styles.emptyList : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  header: {
    backgroundColor: '#1565C0',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#BBDEFB' },
  listContent: { padding: 16, gap: 12 },
  emptyList: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#1A237E', marginBottom: 3 },
  cardSub: { fontSize: 13, color: '#546E7A' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeInactive: { backgroundColor: '#ECEFF1' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextActive: { color: '#2E7D32' },
  badgeTextInactive: { color: '#607D8B' },
});
