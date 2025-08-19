const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GHUB_TOKEN,
});

async function run() {
  const [,, repoName, tipoProjeto] = process.argv;

  if (!repoName) {
    console.error("❌ Uso: node criar-repos.js <repo_name> <tipo_projeto>");
    process.exit(1);
  }

  try {
    // 1. Cria repositório privado
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${tipoProjeto || "site/lp"}) 🚀`,
      auto_init: false,
      // Configurações adicionais
      has_issues: true,
      has_projects: true,
      has_wiki: false,
      has_downloads: true,
      allow_squash_merge: true,
      allow_merge_commit: true,
      allow_rebase_merge: true,
      delete_branch_on_merge: true
    });

    console.log("✅ Repositório criado:", repo.data.html_url);
    const owner = repo.data.owner.login;

    // 2. Adiciona README.md para gerar commit inicial
    try {
      const readmeContent = `# ${repoName}

Repositório automático 🚀

## Tipo do Projeto
${tipoProjeto || "site/lp"}

## Estrutura de Branches
- **main**: Branch principal (desenvolvimento)
- **prd**: Branch de produção (deploy automático na Vercel)

## Deploy
O deploy automático acontece quando há push na branch \`prd\`.

---
*Criado automaticamente via GitHub Actions*
`;

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: "README.md",
        message: "chore: initial commit",
        content: Buffer.from(readmeContent).toString("base64"),
      });

      console.log("📄 Commit inicial criado com README.md");
    } catch (err) {
      if (err.status === 422) {
        console.warn("⚠️ O README.md já existe. Pulando criação do commit inicial.");
      } else {
        throw err;
      }
    }

    // 3. Aguarda um pouco para o commit ser processado
    console.log("⏳ Aguardando processamento do commit inicial...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Pega a referência da branch main
    let mainRef;
    try {
      mainRef = await octokit.rest.git.getRef({
        owner,
        repo: repoName,
        ref: "heads/main"
      });
      console.log("🔍 Branch 'main' encontrada.");
    } catch (err) {
      console.error("❌ Não foi possível encontrar a branch 'main'. Verifique se o commit inicial foi criado corretamente.");
      throw err;
    }

    // 5. Cria branch "prd" a partir da main
    try {
      await octokit.rest.git.createRef({
        owner,
        repo: repoName,
        ref: "refs/heads/prd",
        sha: mainRef.data.object.sha
      });
      console.log("🌿 Branch 'prd' criada com sucesso!");
    } catch (err) {
      if (err.status === 422) {
        console.warn("⚠️ A branch 'prd' já existe. Pulando criação.");
      } else {
        throw err;
      }
    }

    // 6. Adiciona arquivo .gitignore básico na branch prd
    try {
      const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production build
/build
/dist
/.next/
/out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Vercel
.vercel
`;

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: ".gitignore",
        message: "chore: add gitignore",
        content: Buffer.from(gitignoreContent).toString("base64"),
        branch: "prd"
      });

      console.log("📄 .gitignore adicionado na branch prd");
    } catch (err) {
      console.warn("⚠️ Não foi possível criar .gitignore:", err.message);
    }

    console.log("🎉 Repositório configurado com sucesso!");
    console.log(`📁 Repository: https://github.com/${owner}/${repoName}`);
    console.log("🌿 Branches: main (desenvolvimento), prd (produção)");
    console.log("🚀 Deploy automático configurado para branch 'prd'");

  } catch (error) {
    console.error("❌ Erro ao criar repositório ou branches:", error.message || error);
    process.exit(1);
  }
}

run();