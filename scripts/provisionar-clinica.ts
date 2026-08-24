/**
 * Provisionamento de clínica — cria a primeira clínica e seu administrador.
 *
 * Por que existe um script, e não uma tela:
 *
 * As policies de RLS não têm `INSERT` em `clinics`, e `profiles_insert_admin`
 * exige que quem insere JÁ seja admin da clínica. Isso é proposital — fecha a
 * porta para alguém criar tenant pela API — mas cria um ovo-e-galinha: não há
 * como ser admin de uma clínica que ainda não existe.
 *
 * O `/onboarding` (6:5213) é rota Auth + Admin: ele COMPLETA a clínica, não a
 * cria. Ver docs/DESIGN_DECISIONS.md #26.
 *
 * Este script usa a chave `service_role`, que CONTORNA RLS. Ele é operado por
 * pessoa, fora da aplicação, e a chave nunca chega ao browser.
 *
 * Uso:
 *
 *     node --env-file=.env.local scripts/provisionar-clinica.ts \
 *       --clinica "Espaço Serenità" \
 *       --slug espaco-serenita \
 *       --admin-email mariana@clinica.com.br \
 *       --admin-nome "Dra. Mariana Costa"
 *
 * Sem `--senha`, o administrador é criado sem senha e entra pelo link de acesso
 * do próprio login — que é o caminho preferido: senha em linha de comando fica
 * no histórico do shell. Para automação (semear o usuário dos testes e2e),
 * passe a senha pela variável `PROVISION_SENHA`.
 *
 * `--dry-run` valida tudo e não escreve nada.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/server/supabase/database.types.ts";

type Argumentos = {
  clinica: string;
  slug: string;
  adminEmail: string;
  adminNome: string;
  senha: string | null;
  dryRun: boolean;
};

const USO = `
Uso:
  node --env-file=.env.local scripts/provisionar-clinica.ts [opções]

Opções obrigatórias:
  --clinica <nome>        Nome da clínica
  --slug <slug>           Identificador em minúsculas: ^[a-z0-9][a-z0-9-]*$
  --admin-email <email>   E-mail do primeiro administrador
  --admin-nome <nome>     Nome completo do primeiro administrador

Opcionais:
  --dry-run               Valida e não escreve
  --ajuda                 Mostra esta mensagem

Senha:
  Prefira deixar sem senha — o administrador entra pelo link de acesso.
  Para automação, use a variável de ambiente PROVISION_SENHA.
`;

function lerArgumentos(argv: string[]): Argumentos {
  const mapa = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const atual = argv[i]!;
    if (!atual.startsWith("--")) continue;
    const chave = atual.slice(2);
    const proximo = argv[i + 1];
    if (proximo === undefined || proximo.startsWith("--")) {
      mapa.set(chave, "true");
    } else {
      mapa.set(chave, proximo);
      i += 1;
    }
  }

  if (mapa.has("ajuda") || mapa.has("help")) {
    console.log(USO);
    process.exit(0);
  }

  const faltando: string[] = [];
  const obrigatorio = (chave: string): string => {
    const valor = mapa.get(chave)?.trim();
    if (!valor || valor === "true") {
      faltando.push(`--${chave}`);
      return "";
    }
    return valor;
  };

  const clinica = obrigatorio("clinica");
  const slug = obrigatorio("slug");
  const adminEmail = obrigatorio("admin-email");
  const adminNome = obrigatorio("admin-nome");

  if (faltando.length > 0) {
    erro(`Faltam argumentos: ${faltando.join(", ")}\n${USO}`);
  }

  // O mesmo formato da constraint de `clinics.slug`. Validar aqui dá mensagem
  // legível em vez de erro cru do Postgres.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    erro(
      `Slug inválido: "${slug}". Use minúsculas, dígitos e hífen, começando por letra ou dígito.`,
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) {
    erro(`E-mail inválido: "${adminEmail}".`);
  }

  const senha = process.env.PROVISION_SENHA?.trim() || null;
  if (senha !== null && senha.length < 8) {
    erro("PROVISION_SENHA precisa de ao menos 8 caracteres.");
  }

  return {
    clinica,
    slug,
    adminEmail: adminEmail.toLowerCase(),
    adminNome,
    senha,
    dryRun: mapa.has("dry-run"),
  };
}

function erro(mensagem: string): never {
  console.error(`\n✖ ${mensagem}\n`);
  process.exit(1);
}

function lerAmbiente() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !chave) {
    erro(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias.\n" +
        "  Rode com: node --env-file=.env.local scripts/provisionar-clinica.ts ...",
    );
  }

  return { url, chave };
}

async function main() {
  const args = lerArgumentos(process.argv.slice(2));
  const { url, chave } = lerAmbiente();

  // `service_role` contorna RLS. `persistSession: false` porque isto é um
  // processo de uma tacada só, e não queremos escrever token em disco.
  const admin = createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\nProjeto:  ${url}`);
  console.log(`Clínica:  ${args.clinica}  (${args.slug})`);
  console.log(`Admin:    ${args.adminNome} <${args.adminEmail}>`);
  console.log(
    `Senha:    ${args.senha ? "definida por PROVISION_SENHA" : "sem senha — entra por link de acesso"}`,
  );
  if (args.dryRun) console.log("Modo:     dry-run, nada será escrito");
  console.log("");

  // ---- 1. o slug precisa estar livre ------------------------------------
  const { data: existente, error: erroSlug } = await admin
    .from("clinics")
    .select("id, name")
    .eq("slug", args.slug)
    .maybeSingle();

  if (erroSlug)
    erro(`Não foi possível consultar clínicas: ${erroSlug.message}`);
  if (existente) {
    erro(`O slug "${args.slug}" já pertence à clínica "${existente.name}".`);
  }

  // ---- 2. o e-mail não pode já ter perfil --------------------------------
  const usuarioExistente = await procurarUsuarioPorEmail(
    admin,
    args.adminEmail,
  );

  if (usuarioExistente) {
    const { data: perfil } = await admin
      .from("profiles")
      .select("id, clinic_id")
      .eq("id", usuarioExistente.id)
      .maybeSingle();

    if (perfil) {
      erro(
        `${args.adminEmail} já tem perfil na clínica ${perfil.clinic_id}.\n` +
          "  Um perfil pertence a exatamente uma clínica (DESIGN_DECISIONS #10).",
      );
    }
    console.log("• Usuário já existe no Auth e será reaproveitado.");
  }

  if (args.dryRun) {
    console.log("\n✓ Validações passaram. Nada foi escrito (--dry-run).\n");
    return;
  }

  // ---- 3. cria o usuário, se preciso -------------------------------------
  let usuarioId = usuarioExistente?.id ?? null;
  let criamosOUsuario = false;

  if (!usuarioId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: args.adminEmail,
      // Provisionamento é ato administrativo: o e-mail já é confiável, e exigir
      // confirmação deixaria a conta inacessível até alguém clicar num link.
      email_confirm: true,
      ...(args.senha ? { password: args.senha } : {}),
    });

    if (error || !data.user) {
      erro(
        `Não foi possível criar o usuário: ${error?.message ?? "sem detalhe"}`,
      );
    }
    usuarioId = data.user.id;
    criamosOUsuario = true;
    console.log(`• Usuário criado: ${usuarioId}`);
  }

  // ---- 4. cria a clínica --------------------------------------------------
  const { data: clinica, error: erroClinica } = await admin
    .from("clinics")
    .insert({ name: args.clinica, slug: args.slug })
    .select("id")
    .single();

  if (erroClinica || !clinica) {
    // Não deixa usuário órfão de uma execução que falhou no meio.
    if (criamosOUsuario) await admin.auth.admin.deleteUser(usuarioId);
    erro(
      `Não foi possível criar a clínica: ${erroClinica?.message ?? "sem detalhe"}`,
    );
  }
  console.log(`• Clínica criada: ${clinica.id}`);

  // ---- 5. cria o perfil de admin -----------------------------------------
  const { error: erroPerfil } = await admin.from("profiles").insert({
    id: usuarioId,
    clinic_id: clinica.id,
    full_name: args.adminNome,
    role: "admin",
  });

  if (erroPerfil) {
    // Desfaz na ordem inversa. Sem isto sobraria uma clínica sem dono, que
    // ninguém consegue acessar nem apagar pela aplicação.
    await admin.from("clinics").delete().eq("id", clinica.id);
    if (criamosOUsuario) await admin.auth.admin.deleteUser(usuarioId);
    erro(`Não foi possível criar o perfil: ${erroPerfil.message}`);
  }
  console.log(`• Perfil de administrador criado.`);

  // ---- 6. registra na auditoria ------------------------------------------
  // `service_role` contorna a policy que exige `user_id = auth.uid()`, então o
  // provisionamento fica registrado com o próprio admin como autor.
  await admin.from("audit_log").insert({
    clinic_id: clinica.id,
    user_id: usuarioId,
    action: "clinic.provisioned",
    resource_type: "clinic",
    resource_id: clinica.id,
    metadata: { slug: args.slug, via: "scripts/provisionar-clinica" },
  });

  console.log(`
✓ Pronto.

  Clínica ......... ${args.clinica} (${clinica.id})
  Administrador ... ${args.adminEmail}
  Próximo passo ... entrar em /login${
    args.senha
      ? " com a senha definida"
      : ' e usar "Receber link de acesso por e-mail"'
  }
                    e completar o cadastro em /onboarding
`);
}

/**
 * Procura usuário por e-mail.
 *
 * A API de admin não tem busca por e-mail, só listagem paginada — então
 * percorremos as páginas. Para um projeto pequeno é barato; se a base crescer,
 * vale trocar por uma consulta direta a `auth.users`.
 */
async function procurarUsuarioPorEmail(
  admin: ReturnType<typeof createClient<Database>>,
  email: string,
): Promise<{ id: string } | null> {
  const porPagina = 200;

  for (let pagina = 1; pagina <= 50; pagina += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });

    if (error) erro(`Não foi possível listar usuários: ${error.message}`);

    const achado = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (achado) return { id: achado.id };

    if (data.users.length < porPagina) return null;
  }

  return null;
}

main().catch((causa: unknown) => {
  erro(causa instanceof Error ? causa.message : String(causa));
});
