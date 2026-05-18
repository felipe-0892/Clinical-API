import express, { Request, Response, NextFunction } from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import jwt from "jsonwebtoken";

console.log("🚀 Iniciando servidor...");

const app = express();

// ======================================================
// 🔐 CONFIGURAÇÃO JWT
// ======================================================

const JWT_SECRET = "clinical_api_secret_key_2024"; // Em produção, use variável de ambiente

// Usuário fixo para testes
const TEST_USER = {
  email: "admin@teste.com.br",
  senha: "admin123",
  nome: "Administrador",
};

// Middleware de autenticação JWT
function autenticarJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string };
    (req as any).user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
}

app.use(cors());
app.use(express.json());

// 🔹 Servir arquivos estáticos
app.use(express.static(__dirname));

// 🔹 Inicializa SQLite
const db = new sqlite3.Database("./clinica.sqlite", (err: Error | null) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  } else {
    console.log("✅ Banco de dados conectado.");
  }
});

// ======================================================
// 🔹 CRIAÇÃO DAS TABELAS
// ======================================================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      data_consulta TEXT,
      medico TEXT DEFAULT 'Dr. João',
      prontuario TEXT,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sintomas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consulta_sintoma (
      consulta_id INTEGER,
      sintoma_id INTEGER,
      FOREIGN KEY (consulta_id) REFERENCES consultas(id),
      FOREIGN KEY (sintoma_id) REFERENCES sintomas(id),
      PRIMARY KEY (consulta_id, sintoma_id)
    )
  `);

  // ── Migração: adicionar colunas medico e prontuario se não existirem ──
  db.run(`ALTER TABLE consultas ADD COLUMN medico TEXT DEFAULT 'Dr. João'`, () => {});
  db.run(`ALTER TABLE consultas ADD COLUMN prontuario TEXT`, () => {});

  // ======================================================
  // 🔹 DADOS INICIAIS
  // ======================================================

  db.get(
    "SELECT COUNT(*) AS count FROM pacientes",
    (err: Error | null, row: any) => {
      if (err) {
        console.error("❌ Erro ao verificar dados iniciais:", err.message);
        return;
      }

      if (row && row.count === 0) {
        console.log("📦 Inserindo dados iniciais...");

        db.run(`INSERT INTO pacientes (nome) VALUES ('Ana'), ('Carlos'), ('Beatriz')`);
        db.run(`INSERT INTO sintomas (descricao) VALUES ('Febre'), ('Dor de cabeça'), ('Tosse')`);
        db.run(`
          INSERT INTO consultas (paciente_id, data_consulta, medico, prontuario)
          VALUES
            (1, '2026-04-10', 'Dra. Ana Lima', 'Paciente relata febre há 2 dias'),
            (2, '2026-04-11', 'Dr. João Silva', 'Dor de cabeça intensa ao acordar'),
            (3, '2026-04-12', 'Dr. Pedro Costa', 'Tosse seca persistente há 1 semana'),
            (1, '2026-04-15', 'Dra. Ana Lima', 'Retorno — febre controlada')
        `);
        db.run(`
          INSERT INTO consulta_sintoma (consulta_id, sintoma_id)
          VALUES (1,1),(1,2),(2,3),(3,1),(4,1),(4,3)
        `);
      }
    }
  );
});

// ======================================================
// 🔹 ROTA PRINCIPAL
// ======================================================

app.get("/", (req: Request, res: Response) => {
  res.send("✅ API funcionando!");
});

// ======================================================
// 🔐 ROTA DE LOGIN — gera JWT
// ======================================================

app.post("/api/login", (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  if (email !== TEST_USER.email || senha !== TEST_USER.senha) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  const token = jwt.sign(
    { email: TEST_USER.email, nome: TEST_USER.nome },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    message: "Login realizado com sucesso!",
    token,
    usuario: { email: TEST_USER.email, nome: TEST_USER.nome },
  });
});

// ======================================================
// 🔹 ETAPAS SQL (5–10) — protegidas com JWT
// ======================================================

app.get("/api/etapa5", autenticarJWT, (req: Request, res: Response) => {
  db.all("SELECT * FROM pacientes", [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ pacientes: rows });
  });
});

app.get("/api/etapa6", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT p.nome, c.data_consulta
    FROM pacientes p
    JOIN consultas c ON p.id = c.paciente_id
  `;
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/etapa7", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT p.nome, s.descricao AS sintoma
    FROM pacientes p
    JOIN consultas c ON p.id = c.paciente_id
    JOIN consulta_sintoma cs ON c.id = cs.consulta_id
    JOIN sintomas s ON cs.sintoma_id = s.id
  `;
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/etapa8", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT p.nome
    FROM pacientes p
    JOIN consultas c ON p.id = c.paciente_id
    JOIN consulta_sintoma cs ON c.id = cs.consulta_id
    JOIN sintomas s ON cs.sintoma_id = s.id
    WHERE s.descricao = 'Febre'
  `;
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/etapa9", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT p.nome, COUNT(c.id) AS total_consultas
    FROM pacientes p
    LEFT JOIN consultas c ON p.id = c.paciente_id
    GROUP BY p.id
  `;
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/etapa10", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT s.descricao, COUNT(cs.sintoma_id) AS frequencia
    FROM consulta_sintoma cs
    JOIN sintomas s ON cs.sintoma_id = s.id
    GROUP BY cs.sintoma_id
    ORDER BY frequencia DESC
    LIMIT 1
  `;
  db.get(sql, [], (err: Error | null, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// ======================================================
// 🔹 GET - LISTAR ATENDIMENTOS — protegido com JWT
// ======================================================

app.get("/api/atendimentos", autenticarJWT, (req: Request, res: Response) => {
  const sql = `
    SELECT
      c.id,
      p.nome         AS paciente,
      c.medico,
      c.prontuario,
      c.data_consulta,
      GROUP_CONCAT(s.descricao, ', ') AS sintomas
    FROM consultas c
    JOIN pacientes p ON c.paciente_id = p.id
    LEFT JOIN consulta_sintoma cs ON c.id = cs.consulta_id
    LEFT JOIN sintomas s ON cs.sintoma_id = s.id
    GROUP BY c.id
    ORDER BY c.data_consulta DESC
  `;
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ======================================================
// 🔹 POST - NOVO ATENDIMENTO — protegido com JWT
// ======================================================

interface AtendimentoBody {
  nome: string;
  sintoma: string;
  medico?: string;
  prontuario?: string;
}

app.post(
  "/api/atendimento",
  autenticarJWT,
  (req: Request<{}, {}, AtendimentoBody>, res: Response) => {
    const { nome, sintoma, medico, prontuario } = req.body;

    if (
      typeof nome !== "string" ||
      typeof sintoma !== "string" ||
      nome.trim() === "" ||
      sintoma.trim() === "" ||
      !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)
    ) {
      return res.status(400).json({ error: "Nome inválido. Use apenas letras." });
    }

    const medicoVal = (medico || "Dr. João").trim();
    const prontuarioVal = (prontuario || "").trim() || null;
    const dataAtual = new Date().toISOString().split("T")[0];

    db.get(
      `SELECT id FROM pacientes WHERE nome = ?`,
      [nome],
      (err: Error | null, row: any) => {
        if (err) return res.status(500).json({ error: err.message });

        const inserirConsulta = (paciente_id: number) => {
          db.run(
            `INSERT INTO consultas (paciente_id, data_consulta, medico, prontuario) VALUES (?, ?, ?, ?)`,
            [paciente_id, dataAtual, medicoVal, prontuarioVal],
            function (err: Error | null) {
              if (err) return res.status(500).json({ error: err.message });

              const consulta_id = this.lastID;

              db.get(
                `SELECT id FROM sintomas WHERE descricao = ?`,
                [sintoma],
                (err: Error | null, row: any) => {
                  if (err) return res.status(500).json({ error: err.message });

                  if (row) {
                    vincular(consulta_id, row.id);
                  } else {
                    db.run(
                      `INSERT INTO sintomas (descricao) VALUES (?)`,
                      [sintoma],
                      function (err: Error | null) {
                        if (err) return res.status(500).json({ error: err.message });
                        vincular(consulta_id, this.lastID);
                      }
                    );
                  }
                }
              );

              function vincular(c_id: number, s_id: number) {
                db.run(
                  `INSERT INTO consulta_sintoma (consulta_id, sintoma_id) VALUES (?, ?)`,
                  [c_id, s_id],
                  (err: Error | null) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({
                      message: "✅ Atendimento registrado com sucesso!",
                      paciente: nome,
                      sintoma,
                      medico: medicoVal,
                      prontuario: prontuarioVal,
                      data: dataAtual,
                    });
                  }
                );
              }
            }
          );
        };

        if (row) {
          inserirConsulta(row.id);
        } else {
          db.run(
            `INSERT INTO pacientes (nome) VALUES (?)`,
            [nome],
            function (err: Error | null) {
              if (err) return res.status(500).json({ error: err.message });
              inserirConsulta(this.lastID);
            }
          );
        }
      }
    );
  }
);

// ======================================================
// 🔹 PUT - ATUALIZAR ATENDIMENTO — protegido com JWT
// ======================================================

interface AtualizarBody {
  nome: string;
  sintoma: string;
  medico?: string;
  prontuario?: string;
}

app.put(
  "/api/atendimento/:id",
  autenticarJWT,
  (req: Request<{ id: string }, {}, AtualizarBody>, res: Response) => {
    const id = parseInt(req.params.id);
    const { nome, sintoma, medico, prontuario } = req.body;

    if (
      !nome || !sintoma ||
      typeof nome !== "string" || typeof sintoma !== "string" ||
      nome.trim() === "" || sintoma.trim() === "" ||
      !/^[A-Za-zÀ-ÿ\s]+$/.test(nome)
    ) {
      return res.status(400).json({ error: "Nome inválido. Use apenas letras." });
    }

    const medicoVal = (medico || "Dr. João").trim();
    const prontuarioVal = (prontuario || "").trim() || null;

    db.run(
      `UPDATE consultas SET medico = ?, prontuario = ? WHERE id = ?`,
      [medicoVal, prontuarioVal, id],
      function (err: Error | null) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Consulta não encontrada." });

        db.get(
          `SELECT paciente_id FROM consultas WHERE id = ?`,
          [id],
          (err: Error | null, row: any) => {
            if (err) return res.status(500).json({ error: err.message });

            db.run(
              `UPDATE pacientes SET nome = ? WHERE id = ?`,
              [nome.trim(), row.paciente_id],
              (err: Error | null) => {
                if (err) return res.status(500).json({ error: err.message });

                db.run(
                  `DELETE FROM consulta_sintoma WHERE consulta_id = ?`,
                  [id],
                  (err: Error | null) => {
                    if (err) return res.status(500).json({ error: err.message });

                    db.get(
                      `SELECT id FROM sintomas WHERE descricao = ?`,
                      [sintoma.trim()],
                      (err: Error | null, sRow: any) => {
                        if (err) return res.status(500).json({ error: err.message });

                        const vincular = (sintoma_id: number) => {
                          db.run(
                            `INSERT INTO consulta_sintoma (consulta_id, sintoma_id) VALUES (?, ?)`,
                            [id, sintoma_id],
                            (err: Error | null) => {
                              if (err) return res.status(500).json({ error: err.message });
                              res.json({
                                message: "✅ Atendimento atualizado com sucesso!",
                                id, nome: nome.trim(), sintoma: sintoma.trim(),
                                medico: medicoVal, prontuario: prontuarioVal,
                              });
                            }
                          );
                        };

                        if (sRow) {
                          vincular(sRow.id);
                        } else {
                          db.run(
                            `INSERT INTO sintomas (descricao) VALUES (?)`,
                            [sintoma.trim()],
                            function (err: Error | null) {
                              if (err) return res.status(500).json({ error: err.message });
                              vincular(this.lastID);
                            }
                          );
                        }
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

// ======================================================
// 🔹 DELETE - EXCLUIR ATENDIMENTO — protegido com JWT
// ======================================================

app.delete("/api/atendimento/:id", autenticarJWT, (req: Request, res: Response) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idParam, 10);

  db.run(
    `DELETE FROM consulta_sintoma WHERE consulta_id = ?`,
    [id],
    (err: Error | null) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        `DELETE FROM consultas WHERE id = ?`,
        [id],
        function (err: Error | null) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: "Consulta não encontrada." });

          res.json({ message: "✅ Atendimento excluído com sucesso!", id });
        }
      );
    }
  );
});

// ======================================================
// 🔹 PORTA
// ======================================================

const PORT: number = 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Erro não tratado:", err);
});