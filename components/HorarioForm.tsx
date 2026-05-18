import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, FlatList,
} from 'react-native';
import {
  Horario, Usuario, getAllUsuarios,
  createHorario, updateHorario,
} from '../database/initDatabase';

interface Props {
  visible: boolean;
  horario?: Horario | null;
  onClose: () => void;
  onSaved: () => void;
}

type TipoHorario = 'maximo' | 'periodo' | null;

// Simple picker modal reusable
function PickerModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: number | string; label: string }[];
  selectedId: number | string | null;
  onSelect: (id: number | string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pickerStyles.container}>
          <Text style={pickerStyles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[pickerStyles.item, selectedId === item.id && pickerStyles.itemSelected]}
                onPress={() => { onSelect(item.id); onClose(); }}
              >
                <Text style={[pickerStyles.itemText, selectedId === item.id && pickerStyles.itemTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxHeight: '60%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 14,
    textAlign: 'center',
  },
  item: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  itemSelected: { backgroundColor: '#1565C0' },
  itemText: { fontSize: 15, color: '#1A237E', textAlign: 'center' },
  itemTextSelected: { color: '#fff', fontWeight: '700' },
});

// Small select button
function SelectButton({
  label,
  placeholder,
  onPress,
}: {
  label: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={formStyles.selectBtn} onPress={onPress}>
      <Text style={label === placeholder ? formStyles.selectPlaceholder : formStyles.selectValue}>
        {label}
      </Text>
      <Text style={formStyles.selectArrow}>▼</Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={formStyles.sectionLabel}>{children}</Text>;
}

// Validate date string dd/mm/yyyy
function isValidDate(d: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return false;
  const [day, month, year] = d.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// Validate HH:MM
function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function maskDate(text: string, prev: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function maskTime(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export const HorarioForm: React.FC<Props> = ({ visible, horario, onClose, onSaved }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoHorario>(null);

  // Tipo máximo
  const [horas, setHoras] = useState('');
  const [minutos, setMinutos] = useState('');

  // Tipo período
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');

  // Datas
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [mensagem, setMensagem] = useState('');

  // Picker visibility
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showTipoPicker, setShowTipoPicker] = useState(false);

  useEffect(() => {
    getAllUsuarios().then(setUsuarios);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (horario) {
      setSelectedUserId(horario.id_usuario);
      setTipo(horario.tipo);
      if (horario.tipo === 'maximo' && horario.tempo_maximo_minutos != null) {
        setHoras(String(Math.floor(horario.tempo_maximo_minutos / 60)));
        setMinutos(String(horario.tempo_maximo_minutos % 60));
      } else {
        setHoras('');
        setMinutos('');
      }
      setHoraInicio(horario.hora_inicio ?? '');
      setHoraFim(horario.hora_fim ?? '');
      setDataInicio(horario.data_inicio ?? '');
      setDataFim(horario.data_fim ?? '');
      setMensagem(horario.mensagem_fim ?? '');
    } else {
      setSelectedUserId(null);
      setTipo(null);
      setHoras('');
      setMinutos('');
      setHoraInicio('');
      setHoraFim('');
      setDataInicio('');
      setDataFim('');
      setMensagem('');
    }
  }, [horario, visible]);

  const selectedUser = usuarios.find((u) => u.id === selectedUserId);

  const validate = (): boolean => {
    if (!selectedUserId) { Alert.alert('Atenção', 'Selecione um usuário.'); return false; }
    if (!tipo) { Alert.alert('Atenção', 'Selecione o tipo de horário.'); return false; }

    if (tipo === 'maximo') {
      const h = parseInt(horas || '0');
      const m = parseInt(minutos || '0');
      if (isNaN(h) || isNaN(m) || (h === 0 && m === 0)) {
        Alert.alert('Atenção', 'Defina um tempo máximo maior que zero.');
        return false;
      }
      if (m < 0 || m > 59) { Alert.alert('Atenção', 'Minutos devem ser entre 0 e 59.'); return false; }
    }

    if (tipo === 'periodo') {
      if (!isValidTime(horaInicio)) { Alert.alert('Atenção', 'Hora de início inválida. Use HH:MM.'); return false; }
      if (!isValidTime(horaFim)) { Alert.alert('Atenção', 'Hora de fim inválida. Use HH:MM.'); return false; }
    }

    if (!isValidDate(dataInicio)) { Alert.alert('Atenção', 'Data de início inválida. Use DD/MM/AAAA.'); return false; }
    if (dataFim && !isValidDate(dataFim)) { Alert.alert('Atenção', 'Data de fim inválida. Use DD/MM/AAAA.'); return false; }
    if (!mensagem.trim()) { Alert.alert('Atenção', 'Informe a mensagem de fim de uso.'); return false; }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const tempoMax = tipo === 'maximo'
      ? (parseInt(horas || '0') * 60) + parseInt(minutos || '0')
      : null;

    if (horario) {
      await updateHorario(
        horario.id, selectedUserId!, tipo!, tempoMax,
        tipo === 'periodo' ? horaInicio : null,
        tipo === 'periodo' ? horaFim : null,
        dataInicio, dataFim || null, mensagem.trim()
      );
    } else {
      await createHorario(
        selectedUserId!, tipo!, tempoMax,
        tipo === 'periodo' ? horaInicio : null,
        tipo === 'periodo' ? horaFim : null,
        dataInicio, dataFim || null, mensagem.trim()
      );
    }

    onSaved();
    onClose();
  };

  const tipoOptions = [
    { id: 'maximo', label: '⏱ Tempo máximo de uso' },
    { id: 'periodo', label: '📅 Período de uso (início e fim)' },
  ];

  const isFormValid =
    selectedUserId !== null &&
    tipo !== null &&
    dataInicio.length === 10 &&
    mensagem.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={formStyles.overlay}
      >
        <ScrollView>
          <View style={formStyles.container}>
            <Text style={formStyles.title}>
              {horario ? '✏️ Editar Horário' : '➕ Novo Horário'}
            </Text>

            {/* Usuário */}
            <SectionLabel>👤 Usuário</SectionLabel>
            <SelectButton
              label={selectedUser?.nome ?? 'Selecionar usuário...'}
              placeholder="Selecionar usuário..."
              onPress={() => setShowUserPicker(true)}
            />

            {/* Tipo */}
            <SectionLabel>📋 Tipo de restrição</SectionLabel>
            <SelectButton
              label={
                tipo === 'maximo' ? '⏱ Tempo máximo de uso'
                  : tipo === 'periodo' ? '📅 Período de uso'
                    : 'Selecionar tipo...'
              }
              placeholder="Selecionar tipo..."
              onPress={() => setShowTipoPicker(true)}
            />

            {/* Campos condicionais - Máximo */}
            {tipo === 'maximo' && (
              <View style={formStyles.section}>
                <SectionLabel>⏱ Tempo máximo diário</SectionLabel>
                <View style={formStyles.row}>
                  <View style={formStyles.halfInput}>
                    <Text style={formStyles.inputLabel}>Horas</Text>
                    <TextInput
                      style={formStyles.input}
                      placeholder="0"
                      value={horas}
                      onChangeText={(t) => setHoras(t.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      placeholderTextColor="#90A4AE"
                      maxLength={2}
                    />
                  </View>
                  <View style={formStyles.halfInput}>
                    <Text style={formStyles.inputLabel}>Minutos</Text>
                    <TextInput
                      style={formStyles.input}
                      placeholder="0"
                      value={minutos}
                      onChangeText={(t) => setMinutos(t.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      placeholderTextColor="#90A4AE"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Campos condicionais - Período */}
            {tipo === 'periodo' && (
              <View style={formStyles.section}>
                <SectionLabel>📅 Período permitido de uso</SectionLabel>
                <View style={formStyles.row}>
                  <View style={formStyles.halfInput}>
                    <Text style={formStyles.inputLabel}>Início (HH:MM)</Text>
                    <TextInput
                      style={formStyles.input}
                      placeholder="08:00"
                      value={horaInicio}
                      onChangeText={(t) => setHoraInicio(maskTime(t))}
                      keyboardType="numeric"
                      placeholderTextColor="#90A4AE"
                      maxLength={5}
                    />
                  </View>
                  <View style={formStyles.halfInput}>
                    <Text style={formStyles.inputLabel}>Fim (HH:MM)</Text>
                    <TextInput
                      style={formStyles.input}
                      placeholder="22:00"
                      value={horaFim}
                      onChangeText={(t) => setHoraFim(maskTime(t))}
                      keyboardType="numeric"
                      placeholderTextColor="#90A4AE"
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Datas */}
            <SectionLabel>📆 Janela de dias</SectionLabel>
            <View style={formStyles.row}>
              <View style={formStyles.halfInput}>
                <Text style={formStyles.inputLabel}>Data início *</Text>
                <TextInput
                  style={formStyles.input}
                  placeholder="DD/MM/AAAA"
                  value={dataInicio}
                  onChangeText={(t) => setDataInicio(maskDate(t, dataInicio))}
                  keyboardType="numeric"
                  placeholderTextColor="#90A4AE"
                  maxLength={10}
                />
              </View>
              <View style={formStyles.halfInput}>
                <Text style={formStyles.inputLabel}>Data fim (opcional)</Text>
                <TextInput
                  style={formStyles.input}
                  placeholder="DD/MM/AAAA"
                  value={dataFim}
                  onChangeText={(t) => setDataFim(maskDate(t, dataFim))}
                  keyboardType="numeric"
                  placeholderTextColor="#90A4AE"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Mensagem */}
            <SectionLabel>💬 Mensagem de fim de uso</SectionLabel>
            <TextInput
              style={[formStyles.input, formStyles.textArea]}
              placeholder="Ex: Seu tempo de internet acabou por hoje. Vá brincar lá fora!"
              value={mensagem}
              onChangeText={setMensagem}
              multiline
              numberOfLines={3}
              placeholderTextColor="#90A4AE"
            />

            {/* Botões */}
            <View style={formStyles.buttons}>
              <TouchableOpacity style={formStyles.cancelBtn} onPress={onClose}>
                <Text style={formStyles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[formStyles.saveBtn, !isFormValid && formStyles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!isFormValid}
              >
                <Text style={formStyles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <PickerModal
        visible={showUserPicker}
        title="Selecionar Usuário"
        options={usuarios.map((u) => ({ id: u.id, label: u.nome }))}
        selectedId={selectedUserId}
        onSelect={(id) => setSelectedUserId(id as number)}
        onClose={() => setShowUserPicker(false)}
      />
      <PickerModal
        visible={showTipoPicker}
        title="Tipo de Restrição"
        options={tipoOptions}
        selectedId={tipo}
        onSelect={(id) => setTipo(id as TipoHorario)}
        onClose={() => setShowTipoPicker(false)}
      />
    </Modal>
  );
};

const formStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 40,
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546E7A',
    marginBottom: 6,
    marginTop: 14,
  },
  section: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#90A4AE', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A237E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 2,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  selectBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectValue: { fontSize: 15, color: '#1A237E', flex: 1 },
  selectPlaceholder: { fontSize: 15, color: '#90A4AE', flex: 1 },
  selectArrow: { fontSize: 11, color: '#90A4AE' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#546E7A', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1565C0',
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#B0BEC5' },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
