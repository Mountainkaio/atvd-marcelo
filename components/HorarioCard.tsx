import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Horario } from '../database/initDatabase';

interface Props {
  horario: Horario;
  onEdit: (h: Horario) => void;
  onDelete: (id: number) => void;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export const HorarioCard: React.FC<Props> = ({ horario, onEdit, onDelete }) => {
  const isTipo = horario.tipo === 'maximo';

  return (
    <View style={styles.card}>
      {/* Header: usuário + tipo */}
      <View style={styles.topRow}>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>{horario.nome_usuario ?? 'Usuário'}</Text>
        </View>
        <View style={[styles.tipoBadge, isTipo ? styles.tipoMax : styles.tipoPeriod]}>
          <Text style={[styles.tipoBadgeText, isTipo ? styles.tipoMaxText : styles.tipoPeriodText]}>
            {isTipo ? '⏱ Tempo máximo' : '📅 Período'}
          </Text>
        </View>
      </View>

      {/* Conteúdo principal */}
      <View style={styles.body}>
        {isTipo ? (
          <Text style={styles.mainValue}>
            {horario.tempo_maximo_minutos != null
              ? formatMinutes(horario.tempo_maximo_minutos)
              : '--'}
          </Text>
        ) : (
          <Text style={styles.mainValue}>
            {horario.hora_inicio} → {horario.hora_fim}
          </Text>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>📆 Início: </Text>
          <Text style={styles.value}>{horario.data_inicio}</Text>
        </View>

        {horario.data_fim ? (
          <View style={styles.row}>
            <Text style={styles.label}>📆 Fim: </Text>
            <Text style={styles.value}>{horario.data_fim}</Text>
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={styles.label}>📆 Fim: </Text>
            <Text style={[styles.value, { color: '#1565C0' }]}>Sem data fim</Text>
          </View>
        )}

        <View style={[styles.msgBox]}>
          <Text style={styles.msgLabel}>💬 Mensagem:</Text>
          <Text style={styles.msgText} numberOfLines={2}>{horario.mensagem_fim}</Text>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(horario)}>
          <Text style={styles.editBtnText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(horario.id)}>
          <Text style={styles.deleteBtnText}>🗑️ Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 },
  userBadge: {
    backgroundColor: '#1565C0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  userBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tipoBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tipoMax: { backgroundColor: '#FFF8E1' },
  tipoPeriod: { backgroundColor: '#E8F5E9' },
  tipoBadgeText: { fontSize: 13, fontWeight: '600' },
  tipoMaxText: { color: '#F57F17' },
  tipoPeriodText: { color: '#2E7D32' },
  body: { gap: 6, marginBottom: 14 },
  mainValue: { fontSize: 22, fontWeight: '800', color: '#1A237E', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 13, color: '#78909C', fontWeight: '600' },
  value: { fontSize: 13, color: '#37474F' },
  msgBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  msgLabel: { fontSize: 12, color: '#78909C', fontWeight: '600', marginBottom: 2 },
  msgText: { fontSize: 13, color: '#37474F' },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: { color: '#1565C0', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#C62828', fontWeight: '700', fontSize: 14 },
});
