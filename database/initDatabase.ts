import * as SQLite from 'expo-sqlite';

const DB_NAME = 'kidsafe.db';

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync(DB_NAME);
};

export const migrateDbIfNeeded = async (): Promise<void> => {
  const db = await getDatabase();

  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      INSERT INTO usuarios (nome) VALUES ('Usuário 1'), ('Usuário 2');
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS horarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('maximo', 'periodo')),
        tempo_maximo_minutos INTEGER,
        hora_inicio TEXT,
        hora_fim TEXT,
        data_inicio TEXT NOT NULL,
        data_fim TEXT,
        mensagem_fim TEXT NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    await db.execAsync('PRAGMA user_version = 1');
  }
};

export interface Usuario {
  id: number;
  nome: string;
}

export interface Horario {
  id: number;
  id_usuario: number;
  nome_usuario?: string;
  tipo: 'maximo' | 'periodo';
  tempo_maximo_minutos: number | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  data_inicio: string;
  data_fim: string | null;
  mensagem_fim: string;
}

export const getAllUsuarios = async (): Promise<Usuario[]> => {
  const db = await getDatabase();
  return await db.getAllAsync<Usuario>('SELECT * FROM usuarios ORDER BY id');
};

export const getAllHorarios = async (): Promise<Horario[]> => {
  const db = await getDatabase();
  return await db.getAllAsync<Horario>(`
    SELECT horarios.*, usuarios.nome as nome_usuario
    FROM horarios
    LEFT JOIN usuarios ON horarios.id_usuario = usuarios.id
    ORDER BY usuarios.nome, horarios.data_inicio
  `);
};

export const createHorario = async (
  id_usuario: number,
  tipo: 'maximo' | 'periodo',
  tempo_maximo_minutos: number | null,
  hora_inicio: string | null,
  hora_fim: string | null,
  data_inicio: string,
  data_fim: string | null,
  mensagem_fim: string
): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO horarios
      (id_usuario, tipo, tempo_maximo_minutos, hora_inicio, hora_fim, data_inicio, data_fim, mensagem_fim)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_usuario, tipo, tempo_maximo_minutos, hora_inicio, hora_fim, data_inicio, data_fim, mensagem_fim]
  );
  return result.lastInsertRowId;
};

export const updateHorario = async (
  id: number,
  id_usuario: number,
  tipo: 'maximo' | 'periodo',
  tempo_maximo_minutos: number | null,
  hora_inicio: string | null,
  hora_fim: string | null,
  data_inicio: string,
  data_fim: string | null,
  mensagem_fim: string
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE horarios SET
      id_usuario = ?, tipo = ?, tempo_maximo_minutos = ?,
      hora_inicio = ?, hora_fim = ?, data_inicio = ?,
      data_fim = ?, mensagem_fim = ?
     WHERE id = ?`,
    [id_usuario, tipo, tempo_maximo_minutos, hora_inicio, hora_fim, data_inicio, data_fim, mensagem_fim, id]
  );
};

export const deleteHorario = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM horarios WHERE id = ?', [id]);
};
