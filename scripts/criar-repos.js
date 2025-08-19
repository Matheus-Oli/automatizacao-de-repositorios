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
    // Cria repositório vazio, sem inicializar branch main
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: `Repositório automático (${tipoProjeto || "site/lp"}) 🚀`,
      auto_init: false
    });

    console.log("✅ Repositório criado:", repo.data.html_url);
    console.log("⚠️ Branch principal será criada automaticamente pelo GitHub se você adicionar arquivos.");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

run();
