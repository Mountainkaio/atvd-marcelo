import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Horario, getAllHorarios, deleteHorario } from '../../database/initDatabase';
import { HorarioCard } from '../../components/HorarioCard';
import { HorarioForm } from '../../components/HorarioForm';
import { EmptyState } from '../../components/EmptyState';

export default function HorariosScreen() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [listKey, setListKey] = useState(0);

  const load = useCallback(async () => {
    const result = await getAllHorarios();
    setHorarios(result);
    setListKey((k) => k + 1);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleEdit = (horario: Horario) => {
    setEditingHorario(horario);
    setFormVisible(true);
  };

  const handleDelete = (id: number) => {
    setIdToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (idToDelete !== null) {
      await deleteHorario(idToDelete);
      await load();
    }
    setDeleteModalVisible(false);
    setIdToDelete(null);
  };

  const handleCloseForm = () => {
    setFormVisible(false);
    setEditingHorario(null);
  };

  const handleSaved = async () => {
    await load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⏱️ Horários</Text>
        <Text style={styles.subtitle}>Regras de uso por usuário</Text>
      </View>

      <FlatList
        key={`horarios-${listKey}`}
        data={horarios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <HorarioCard horario={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        ListEmptyComponent={<EmptyState message="Nenhum horário cadastrado" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1565C0']} />
        }
        contentContainerStyle={horarios.length === 0 ? styles.emptyList : styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <HorarioForm
        visible={formVisible}
        horario={editingHorario}
        onClose={handleCloseForm}
        onSaved={handleSaved}
      />

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Confirmar Exclusão</Text>
            <Text style={styles.deleteMessage}>
              Tem certeza que deseja excluir este horário?
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmDelete}>
                <Text style={styles.confirmBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#BBDEFB' },
  listContent: { padding: 16, gap: 12 },
  emptyList: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300', marginTop: -2 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '82%',
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteMessage: { fontSize: 15, color: '#546E7A', textAlign: 'center', marginBottom: 20 },
  deleteButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#546E7A', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#C62828',
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
